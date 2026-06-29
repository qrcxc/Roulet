import { Maximize2, Settings, ShieldCheck, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getLatestBets, placeRouletteBet } from './api/roulette'
import { AppShell } from './components/AppShell'
import { ControlPanel } from './components/ControlPanel'
import { LiveBets } from './components/LiveBets'
import { RouletteTable } from './components/RouletteTable'
import { RouletteWheel } from './components/RouletteWheel'
import type { BetAction, BetTarget, ChipValue, LiveBet, LiveBetTab, SpinResult } from './types'
import { buildRouletteBetRequest, formatCoins, getBetMap, getTotalBet, randomRouletteNumber, resolveSpin, toPlacedBets } from './utils/roulette'
import { playSound } from './utils/sound'

const STARTING_BALANCE = 100000
const MAX_BET = 100000
const SPIN_DURATION_MS = 6000
type GameMode = 'auto' | 'manual'

function App() {
  const [selectedChip, setSelectedChip] = useState<ChipValue>(1)
  const [actions, setActions] = useState<BetAction[]>([])
  const [previousActions, setPreviousActions] = useState<BetAction[]>([])
  const [balance, setBalance] = useState(STARTING_BALANCE)
  const [isSpinning, setIsSpinning] = useState(false)
  const [gameMode, setGameMode] = useState<GameMode>('manual')
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [lastResult, setLastResult] = useState<SpinResult | null>(null)
  const [pendingResult, setPendingResult] = useState<SpinResult | null>(null)
  const [spinIndex, setSpinIndex] = useState(0)
  const [liveBets, setLiveBets] = useState<LiveBet[]>([])
  const [liveTab, setLiveTab] = useState<LiveBetTab>('all')
  const [soundOn, setSoundOn] = useState(true)
  const autoDelayRef = useRef<number | null>(null)
  const autoRunningRef = useRef(false)
  const balanceRef = useRef(STARTING_BALANCE)
  const isSpinningRef = useRef(false)

  const totalBet = useMemo(() => getTotalBet(actions), [actions])
  const betMap = useMemo(() => getBetMap(actions), [actions])

  useEffect(() => {
    balanceRef.current = balance
  }, [balance])

  useEffect(() => {
    isSpinningRef.current = isSpinning
  }, [isSpinning])

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
    return () => {
      if (autoDelayRef.current !== null) {
        window.clearTimeout(autoDelayRef.current)
      }
    }
  }, [])

  function addBet(target: BetTarget) {
    if (isSpinning || isAutoRunning || totalBet + selectedChip > MAX_BET) return

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
    if (actions.length) setPreviousActions(actions)
    if (actions.length) playSound('clear', soundOn)
    setActions([])
  }

  function undoBet() {
    if (actions.length) playSound('clear', soundOn)
    setActions((current) => current.slice(0, -1))
  }

  function repeatBet() {
    if (!previousActions.length || isSpinning || isAutoRunning) return
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

    const spinActions = actions.map((action) => ({ ...action }))

    if (gameMode === 'auto') {
      if (!canStartSpin(spinActions)) return
      autoRunningRef.current = true
      setIsAutoRunning(true)
      runSpin(spinActions, true)
      return
    }

    runSpin(spinActions, false)
  }

  function canStartSpin(spinActions: BetAction[]) {
    const spinTotal = getTotalBet(spinActions)
    return spinActions.length > 0 && !isSpinningRef.current && spinTotal <= balanceRef.current && spinTotal <= MAX_BET
  }

  function runSpin(spinActions: BetAction[], continueAuto: boolean) {
    if (!canStartSpin(spinActions)) {
      if (continueAuto) stopAuto()
      return
    }

    const spinTotal = getTotalBet(spinActions)
    const placedBets = toPlacedBets(spinActions)
    const payload = buildRouletteBetRequest(placedBets)
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

    void placeRouletteBet(payload).catch(() => undefined)

    window.setTimeout(() => {
      const nextBalance = balanceRef.current + result.payout
      setLastResult(result)
      setPendingResult(null)
      setBalance((current) => {
        const updated = current + result.payout
        balanceRef.current = updated
        return updated
      })
      setPreviousActions(spinActions)
      setLiveBets((current) => [
        {
          id: result.id,
          user: 'you',
          game: 'Roulette',
          bet: result.totalBet,
          multiplier: result.multiplier,
          win: result.payout,
        },
        ...current,
      ].slice(0, 10))
      playSound(result.payout > 0 ? 'win' : 'lose', soundOn)
      isSpinningRef.current = false
      setIsSpinning(false)

      if (continueAuto && autoRunningRef.current && nextBalance >= spinTotal) {
        const nextActions = spinActions.map((action) => ({ ...action, createdAt: Date.now() }))
        setActions(nextActions)
        autoDelayRef.current = window.setTimeout(() => {
          autoDelayRef.current = null
          if (autoRunningRef.current) runSpin(nextActions, true)
        }, 700)
        return
      }

      if (continueAuto) stopAuto()
      setActions([])
    }, SPIN_DURATION_MS)
  }

  const resultCopy = lastResult
    ? lastResult.payout > 0
      ? `Win ${formatCoins(lastResult.payout)} COINS`
      : 'No win'
    : 'Place your chips'

  return (
    <AppShell balance={balance}>
      <section className="roulette-layout">
        <ControlPanel
          canRepeat={previousActions.length > 0}
          isAutoRunning={isAutoRunning}
          isSpinning={isSpinning}
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
            <button aria-label="settings" disabled={isSpinning} type="button">
              <Settings size={20} />
            </button>
            <button aria-label={soundOn ? 'sound on' : 'sound off'} onClick={() => setSoundOn((value) => !value)} type="button">
              {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button aria-label="fullscreen" onClick={() => document.documentElement.requestFullscreen?.()} type="button">
              <Maximize2 size={20} />
            </button>
          </div>

          <div className="game-top">
            <div className="result-strip">
              <span>{resultCopy}</span>
              <strong>{lastResult ? lastResult.number : '-'}</strong>
            </div>
            <RouletteWheel
              isSpinning={isSpinning}
              result={pendingResult?.number ?? lastResult?.number ?? null}
              soundOn={soundOn}
              spinIndex={spinIndex}
            />
          </div>

          <RouletteTable betMap={betMap} disabled={isSpinning} onTarget={addBet} winningNumber={lastResult?.number ?? null} />

          <button className="fair-button" type="button">
            <ShieldCheck size={18} />
            Provably Fair
          </button>
        </div>
      </section>

      <LiveBets activeTab={liveTab} bets={liveBets} onTabChange={setLiveTab} />
    </AppShell>
  )
}

export default App
