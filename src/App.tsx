import { AlertTriangle, CheckCircle2, Info, Maximize2, Settings, ShieldCheck, Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { apiSession, getApiErrorMessage } from './api/client'
import { getLatestBets, loginPlayer, placeRouletteBet } from './api/roulette'
import { AppShell } from './components/AppShell'
import type { ShellPanel } from './components/AppShell'
import { ControlPanel } from './components/ControlPanel'
import { LiveBets } from './components/LiveBets'
import { RouletteTable } from './components/RouletteTable'
import { RouletteWheel } from './components/RouletteWheel'
import type { BetAction, BetTarget, ChipValue, LiveBet, LiveBetTab, SpinResult } from './types'
import { buildRouletteBetRequest, formatCoins, getBetMap, getTotalBet, randomRouletteNumber, resolveSpin, toPlacedBets } from './utils/roulette'
import { playSound } from './utils/sound'

const STARTING_BALANCE = 100000
const MAX_BET = 100000
const DAILY_CLAIM_AMOUNT = 500
const SPIN_DURATION_MS = 6000

type GameMode = 'auto' | 'manual'
type AppDialog = ShellPanel | 'login' | 'settings' | 'fair' | null
type NoticeType = 'error' | 'success' | 'info'

interface Notice {
  type: NoticeType
  message: string
}

function App() {
  const [selectedChip, setSelectedChip] = useState<ChipValue>(1)
  const [actions, setActions] = useState<BetAction[]>([])
  const [previousActions, setPreviousActions] = useState<BetAction[]>([])
  const [balance, setBalance] = useState(STARTING_BALANCE)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isSubmittingBet, setIsSubmittingBet] = useState(false)
  const [gameMode, setGameMode] = useState<GameMode>('manual')
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [lastResult, setLastResult] = useState<SpinResult | null>(null)
  const [pendingResult, setPendingResult] = useState<SpinResult | null>(null)
  const [spinHistory, setSpinHistory] = useState<SpinResult[]>([])
  const [spinIndex, setSpinIndex] = useState(0)
  const [liveBets, setLiveBets] = useState<LiveBet[]>([])
  const [liveTab, setLiveTab] = useState<LiveBetTab>('all')
  const [soundOn, setSoundOn] = useState(true)
  const [activeDialog, setActiveDialog] = useState<AppDialog>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [userName, setUserName] = useState<string | null>(() => apiSession.getUserName())
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [dailyClaimed, setDailyClaimed] = useState(() => localStorage.getItem('roulette.dailyClaimedOn') === getTodayKey())
  const autoDelayRef = useRef<number | null>(null)
  const autoRunningRef = useRef(false)
  const balanceRef = useRef(STARTING_BALANCE)
  const isSpinningRef = useRef(false)
  const isSubmittingBetRef = useRef(false)

  const totalBet = useMemo(() => getTotalBet(actions), [actions])
  const betMap = useMemo(() => getBetMap(actions), [actions])
  const fairProof = useMemo(() => buildFairProof(userName, spinIndex), [spinIndex, userName])

  useEffect(() => {
    balanceRef.current = balance
  }, [balance])

  useEffect(() => {
    isSpinningRef.current = isSpinning
  }, [isSpinning])

  useEffect(() => {
    isSubmittingBetRef.current = isSubmittingBet
  }, [isSubmittingBet])

  useEffect(() => {
    autoRunningRef.current = isAutoRunning
  }, [isAutoRunning])

  useEffect(() => {
    let cancelled = false
    getLatestBets(liveTab).then((bets) => {
      if (!cancelled) setLiveBets(bets)
    })

    return () => {
      cancelled = true
    }
  }, [liveTab])

  useEffect(() => {
    if (!notice) return undefined

    const timeoutId = window.setTimeout(() => setNotice(null), 5600)
    return () => window.clearTimeout(timeoutId)
  }, [notice])

  useEffect(() => {
    if (!activeDialog) return undefined

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveDialog(null)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [activeDialog])

  useEffect(() => {
    return () => {
      if (autoDelayRef.current !== null) {
        window.clearTimeout(autoDelayRef.current)
      }
    }
  }, [])

  function addBet(target: BetTarget) {
    if (isSubmittingBet || isSpinning || isAutoRunning || totalBet + selectedChip > MAX_BET) return

    playSound('chip', soundOn)
    setActions((current) => [
      ...current,
      {
        target,
        amount: selectedChip,
        createdAt: Date.now(),
      },
    ])
  }

  function clearBets() {
    if (isSubmittingBet) return
    if (actions.length) setPreviousActions(actions)
    if (actions.length) playSound('clear', soundOn)
    setActions([])
  }

  function undoBet() {
    if (isSubmittingBet) return
    if (actions.length) playSound('clear', soundOn)
    setActions((current) => current.slice(0, -1))
  }

  function repeatBet() {
    if (!previousActions.length || isSubmittingBet || isSpinning || isAutoRunning) return
    playSound('chip', soundOn)
    setActions(previousActions.map((action) => ({ ...action, createdAt: Date.now() })))
  }

  function stopAuto() {
    autoRunningRef.current = false
    setIsAutoRunning(false)
    if (autoDelayRef.current !== null) {
      window.clearTimeout(autoDelayRef.current)
      autoDelayRef.current = null
    }
  }

  function handleBet() {
    if (isAutoRunning) {
      stopAuto()
      return
    }

    if (!userName) {
      setActiveDialog('login')
      setNotice({ type: 'info', message: 'Log in before placing a roulette bet.' })
      return
    }

    const spinActions = actions.map((action) => ({ ...action }))

    if (gameMode === 'auto') {
      if (!canStartSpin(spinActions)) return
      autoRunningRef.current = true
      setIsAutoRunning(true)
      void runSpin(spinActions, true)
      return
    }

    void runSpin(spinActions, false)
  }

  function canStartSpin(spinActions: BetAction[]) {
    const spinTotal = getTotalBet(spinActions)
    return spinActions.length > 0 && !isSubmittingBetRef.current && !isSpinningRef.current && spinTotal <= balanceRef.current && spinTotal <= MAX_BET
  }

  async function runSpin(spinActions: BetAction[], continueAuto: boolean) {
    if (!canStartSpin(spinActions)) {
      if (continueAuto) stopAuto()
      return
    }

    const spinTotal = getTotalBet(spinActions)
    const placedBets = toPlacedBets(spinActions)
    const payload = buildRouletteBetRequest(placedBets)

    isSubmittingBetRef.current = true
    setIsSubmittingBet(true)
    setNotice(null)

    try {
      await placeRouletteBet(payload)
    } catch (error) {
      if (continueAuto) stopAuto()
      setNotice({
        type: 'error',
        message: `Bet was not accepted by the API. ${getApiErrorMessage(error)}`,
      })
      return
    } finally {
      isSubmittingBetRef.current = false
      setIsSubmittingBet(false)
    }

    const result = resolveSpin(spinActions, randomRouletteNumber())
    isSpinningRef.current = true
    setIsSpinning(true)
    setPendingResult(result)
    setSpinIndex((current) => current + 1)
    setBalance((current) => {
      const updated = current - spinTotal
      balanceRef.current = updated
      return updated
    })
    playSound('spin', soundOn)

    window.setTimeout(() => {
      const nextBalance = balanceRef.current + result.payout
      setLastResult(result)
      setSpinHistory((current) => [result, ...current].slice(0, 12))
      setPendingResult(null)
      setBalance((current) => {
        const updated = current + result.payout
        balanceRef.current = updated
        return updated
      })
      setPreviousActions(spinActions)
      setLiveBets((current) =>
        [
          {
            id: result.id,
            user: userName || 'you',
            game: 'Roulette',
            bet: result.totalBet,
            multiplier: result.multiplier,
            win: result.payout,
          },
          ...current,
        ].slice(0, 10),
      )
      playSound(result.payout > 0 ? 'win' : 'lose', soundOn)
      isSpinningRef.current = false
      setIsSpinning(false)

      if (continueAuto && autoRunningRef.current && nextBalance >= spinTotal) {
        const nextActions = spinActions.map((action) => ({ ...action, createdAt: Date.now() }))
        setActions(nextActions)
        autoDelayRef.current = window.setTimeout(() => {
          autoDelayRef.current = null
          if (autoRunningRef.current) void runSpin(nextActions, true)
        }, 700)
        return
      }

      if (continueAuto) stopAuto()
      setActions([])
    }, SPIN_DURATION_MS)
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginError(null)
    setIsLoggingIn(true)

    try {
      const session = await loginPlayer(loginIdentifier, loginPassword)
      setUserName(session.username)
      setLoginPassword('')
      setActiveDialog(null)
      setNotice({
        type: session.offline ? 'info' : 'success',
        message: session.offline ? 'Logged in locally. Backend auth is unavailable right now.' : `Logged in as ${session.username}.`,
      })
    } catch (error) {
      setLoginError(getApiErrorMessage(error))
    } finally {
      setIsLoggingIn(false)
    }
  }

  function handleLogout() {
    stopAuto()
    apiSession.clear()
    setUserName(null)
    setActiveDialog(null)
    setNotice({ type: 'info', message: 'Logged out.' })
  }

  function handleDailyClaim() {
    if (!userName) {
      setActiveDialog('login')
      setNotice({ type: 'info', message: 'Log in to claim your daily coins.' })
      return
    }

    if (dailyClaimed) {
      setNotice({ type: 'info', message: 'Daily claim is already collected today.' })
      return
    }

    setDailyClaimed(true)
    localStorage.setItem('roulette.dailyClaimedOn', getTodayKey())
    setBalance((current) => {
      const updated = current + DAILY_CLAIM_AMOUNT
      balanceRef.current = updated
      return updated
    })
    setNotice({ type: 'success', message: `Daily claim added ${formatCoins(DAILY_CLAIM_AMOUNT)} COINS.` })
  }

  function toggleFullscreen() {
    if (!document.fullscreenEnabled) {
      setNotice({ type: 'error', message: 'Fullscreen is not available in this browser.' })
      return
    }

    const action = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
    void action.catch(() => {
      setNotice({ type: 'error', message: 'Fullscreen request was blocked by the browser.' })
    })
  }

  const resultCopy = lastResult
    ? lastResult.payout > 0
      ? `Win ${formatCoins(lastResult.payout)} COINS`
      : 'No win'
    : 'Place your chips'
  const netResult = lastResult ? lastResult.payout - lastResult.totalBet : 0

  return (
    <>
      <AppShell
        balance={balance}
        dailyClaimed={dailyClaimed}
        onDailyClaim={handleDailyClaim}
        onLoginClick={() => setActiveDialog('login')}
        onLogout={handleLogout}
        onOpenPanel={setActiveDialog}
        userName={userName}
      >
        {notice && <NoticeBanner notice={notice} onClose={() => setNotice(null)} />}

        <section className="roulette-layout">
          <ControlPanel
            canRepeat={previousActions.length > 0}
            isAuthenticated={Boolean(userName)}
            isAutoRunning={isAutoRunning}
            isSpinning={isSpinning}
            isSubmitting={isSubmittingBet}
            maxBet={MAX_BET}
            mode={gameMode}
            onBet={handleBet}
            onChipChange={setSelectedChip}
            onClear={clearBets}
            onModeChange={setGameMode}
            onRepeat={repeatBet}
            onUndo={undoBet}
            selectedChip={selectedChip}
            totalBet={totalBet}
          />

          <div className="game-surface">
            <div className="game-toolbar">
              <button aria-label="Open settings" onClick={() => setActiveDialog('settings')} type="button">
                <Settings size={20} />
              </button>
              <button aria-label={soundOn ? 'Mute sound' : 'Turn sound on'} onClick={() => setSoundOn((value) => !value)} type="button">
                {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              <button aria-label="Toggle fullscreen" onClick={toggleFullscreen} type="button">
                <Maximize2 size={20} />
              </button>
            </div>

            <div className="game-top">
              <div className={lastResult ? `result-strip ${lastResult.payout > 0 ? 'win' : 'lose'}` : 'result-strip'}>
                <span>{isSubmittingBet ? 'Checking API' : resultCopy}</span>
                <strong>{lastResult ? lastResult.number : '-'}</strong>
                {lastResult && (
                  <div className="result-money">
                    <small>{lastResult.payout > 0 ? 'Payout' : 'Payout'}</small>
                    <b>{formatCoins(lastResult.payout)} COINS</b>
                    <em className={netResult >= 0 ? 'positive' : 'danger'}>
                      {netResult >= 0 ? '+' : ''}
                      {formatCoins(netResult)} net
                    </em>
                  </div>
                )}
              </div>
              <RouletteWheel
                isSpinning={isSpinning}
                result={pendingResult?.number ?? lastResult?.number ?? null}
                soundOn={soundOn}
                spinIndex={spinIndex}
              />
            </div>

            <section className="spin-history" aria-label="Spin history">
              <span>History</span>
              <div>
                {spinHistory.length ? (
                  spinHistory.map((item) => (
                    <i className={`history-number ${item.color} ${item.payout > 0 ? 'win' : ''}`} key={item.id}>
                      {item.number}
                    </i>
                  ))
                ) : (
                  <small>No spins yet</small>
                )}
              </div>
            </section>

            <RouletteTable betMap={betMap} disabled={isSubmittingBet || isSpinning} onTarget={addBet} winningNumber={lastResult?.number ?? null} />

            <button className="fair-button" onClick={() => setActiveDialog('fair')} type="button">
              <ShieldCheck size={18} />
              Provably Fair
            </button>
          </div>
        </section>

        <LiveBets activeTab={liveTab} bets={liveBets} onTabChange={setLiveTab} />
      </AppShell>

      {activeDialog === 'login' && (
        <Modal title="Log In" onClose={() => setActiveDialog(null)}>
          <form className="login-form" onSubmit={handleLoginSubmit}>
            <label>
              <span>Email or username</span>
              <input
                autoComplete="username"
                autoFocus
                onChange={(event) => setLoginIdentifier(event.target.value)}
                placeholder="player@thedoctor"
                type="text"
                value={loginIdentifier}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                autoComplete="current-password"
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Password"
                type="password"
                value={loginPassword}
              />
            </label>
            {loginError && <p className="form-error">{loginError}</p>}
            <button className="modal-primary" disabled={isLoggingIn} type="submit">
              {isLoggingIn ? 'Logging In' : 'Log In'}
            </button>
          </form>
        </Modal>
      )}

      {activeDialog === 'settings' && (
        <Modal title="Settings" onClose={() => setActiveDialog(null)}>
          <div className="settings-list">
            <div className="setting-row">
              <span>
                <strong>Sound</strong>
                <small>{soundOn ? 'Enabled' : 'Muted'}</small>
              </span>
              <button className={soundOn ? 'toggle active' : 'toggle'} onClick={() => setSoundOn((value) => !value)} type="button">
                {soundOn ? 'On' : 'Off'}
              </button>
            </div>
            <div className="setting-row">
              <span>
                <strong>Fullscreen</strong>
                <small>{document.fullscreenElement ? 'Active' : 'Windowed'}</small>
              </span>
              <button className="modal-secondary" onClick={toggleFullscreen} type="button">
                Toggle
              </button>
            </div>
          </div>
        </Modal>
      )}

      {activeDialog === 'fair' && (
        <Modal title="Provably Fair" onClose={() => setActiveDialog(null)}>
          <dl className="fair-grid">
            <div>
              <dt>Client seed</dt>
              <dd>{fairProof.clientSeed}</dd>
            </div>
            <div>
              <dt>Nonce</dt>
              <dd>{fairProof.nonce}</dd>
            </div>
            <div>
              <dt>Seed hash</dt>
              <dd>{fairProof.seedHash}</dd>
            </div>
          </dl>
        </Modal>
      )}

      {isShellPanel(activeDialog) && (
        <PanelDialog
          balance={balance}
          dailyClaimed={dailyClaimed}
          onClose={() => setActiveDialog(null)}
          panel={activeDialog}
          userName={userName}
        />
      )}
    </>
  )
}

function NoticeBanner({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  const Icon = notice.type === 'error' ? AlertTriangle : notice.type === 'success' ? CheckCircle2 : Info

  return (
    <div className={`notice-banner ${notice.type}`} role="status">
      <Icon size={18} />
      <span>{notice.message}</span>
      <button aria-label="Close message" onClick={onClose} type="button">
        <X size={16} />
      </button>
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="presentation"
    >
      <section aria-label={title} aria-modal="true" className="modal-card" role="dialog">
        <header className="modal-header">
          <h2>{title}</h2>
          <button aria-label="Close dialog" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

function PanelDialog({
  balance,
  dailyClaimed,
  panel,
  userName,
  onClose,
}: {
  balance: number
  dailyClaimed: boolean
  panel: ShellPanel
  userName: string | null
  onClose: () => void
}) {
  const content = getPanelContent(panel, balance, userName, dailyClaimed)

  return (
    <Modal title={content.title} onClose={onClose}>
      <div className="panel-content">
        <div className="panel-metrics">
          {content.metrics.map((metric) => (
            <div key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
        <ul>
          {content.rows.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}

function getPanelContent(panel: ShellPanel, balance: number, userName: string | null, dailyClaimed: boolean) {
  if (panel === 'pointshop') {
    return {
      title: 'Pointshop',
      metrics: [
        { label: 'Balance', value: `${formatCoins(balance)} COINS` },
        { label: 'Daily', value: dailyClaimed ? 'Collected' : 'Ready' },
      ],
      rows: ['Green table skin - 2,500 COINS', 'Gold wheel marker - 5,000 COINS', 'VIP badge - 15,000 COINS'],
    }
  }

  if (panel === 'leaderboard') {
    return {
      title: 'Leaderboard',
      metrics: [
        { label: 'Top win', value: '180,000 COINS' },
        { label: 'Your rank', value: userName ? '#24' : 'Guest' },
      ],
      rows: ['greenhat - 180,000 COINS', 'coinpilot - 124,500 COINS', 'shadowline - 88,000 COINS'],
    }
  }

  if (panel === 'roulette') {
    return {
      title: 'Roulette',
      metrics: [
        { label: 'Max bet', value: `${formatCoins(MAX_BET)} COINS` },
        { label: 'Mode', value: 'Manual / Auto' },
      ],
      rows: ['European wheel', 'Live bets feed', 'API-checked bet submission'],
    }
  }

  if (panel === 'profile') {
    const token = apiSession.getToken()

    return {
      title: 'Profile',
      metrics: [
        { label: 'User', value: userName || 'Guest' },
        { label: 'Session', value: token?.startsWith('local-') ? 'Local' : 'API' },
      ],
      rows: [`Balance - ${formatCoins(balance)} COINS`, `Daily claim - ${dailyClaimed ? 'collected' : 'ready'}`],
    }
  }

  return {
    title: 'Home Page',
    metrics: [
      { label: 'Game', value: 'Roulette' },
      { label: 'Session', value: userName ? 'Logged in' : 'Guest' },
    ],
    rows: ['Roulette table online', 'Daily claim available', 'Leaderboard and pointshop connected'],
  }
}

function isShellPanel(dialog: AppDialog): dialog is ShellPanel {
  return dialog === 'home' || dialog === 'pointshop' || dialog === 'leaderboard' || dialog === 'roulette' || dialog === 'profile'
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function buildFairProof(userName: string | null, spinIndex: number) {
  const clientSeed = `${userName || 'guest'}-${getTodayKey()}`
  const nonce = spinIndex + 1

  return {
    clientSeed,
    nonce,
    seedHash: makeHash(`${clientSeed}:${nonce}:roulette`),
  }
}

function makeHash(input: string) {
  let hash = 2166136261
  const chunks = Array.from({ length: 8 }, (_, index) => {
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i) + index
      hash = Math.imul(hash, 16777619)
    }

    hash ^= index + 0x9e3779b9
    hash = Math.imul(hash, 16777619)
    return (hash >>> 0).toString(16).padStart(8, '0')
  })

  return chunks.join('')
}

export default App
