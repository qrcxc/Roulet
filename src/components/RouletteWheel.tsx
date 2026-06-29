import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { EUROPEAN_WHEEL_ORDER } from '../data/roulette'
import { playSound } from '../utils/sound'

const BALL_START_ANGLE = -18
const BALL_START_RADIUS = 134
const BALL_TRACK_RADIUS = 126
const BALL_POCKET_RADIUS = 104
const SPIN_DURATION_MS = 6000

interface RouletteWheelProps {
  isSpinning: boolean
  result: number | null
  soundOn: boolean
  spinIndex: number
}

interface BallState {
  angle: number
  radius: number
  scale: number
  trail: number
}

export function RouletteWheel({ isSpinning, result, soundOn, spinIndex }: RouletteWheelProps) {
  const frameRef = useRef<number | null>(null)
  const angleRef = useRef(BALL_START_ANGLE)
  const lastPocketRef = useRef<number | null>(null)
  const lastPocketSoundAtRef = useRef(0)
  const soundOnRef = useRef(soundOn)
  const [ball, setBall] = useState<BallState>({
    angle: BALL_START_ANGLE,
    radius: BALL_START_RADIUS,
    scale: 1,
    trail: 0,
  })

  useEffect(() => {
    soundOnRef.current = soundOn
  }, [soundOn])

  const targetAngle = useMemo(() => {
    if (result === null) return BALL_START_ANGLE

    const segment = 360 / EUROPEAN_WHEEL_ORDER.length
    const resultIndex = Math.max(0, EUROPEAN_WHEEL_ORDER.indexOf(result))

    return resultIndex * segment + segment / 2
  }, [result])

  useEffect(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current)
    }

    if (result === null) {
      setBall({ angle: BALL_START_ANGLE, radius: BALL_START_RADIUS, scale: 1, trail: 0 })
      angleRef.current = BALL_START_ANGLE
      lastPocketRef.current = null
      lastPocketSoundAtRef.current = 0
      return undefined
    }

    const startTime = window.performance.now()
    const startAngle = angleRef.current
    const normalizedStart = normalizeAngle(startAngle)
    const fullTurns = 7 + (spinIndex % 3)
    const angularDistance = ((targetAngle - normalizedStart + 360) % 360) + fullTurns * 360
    const rattleSeed = (spinIndex % 7) * 0.37
    lastPocketRef.current = null
    lastPocketSoundAtRef.current = 0

    function animate(now: number) {
      const progress = clamp((now - startTime) / SPIN_DURATION_MS, 0, 1)
      const distanceProgress = easeOutPower(progress, 1.82)
      const pocketProgress = clamp((progress - 0.52) / 0.48, 0, 1)
      const rattleProgress = clamp((progress - 0.58) / 0.36, 0, 1)
      const settleProgress = clamp((progress - 0.8) / 0.2, 0, 1)
      const rattleEnergy = Math.pow(1 - rattleProgress, 1.7)
      const deflectorHit =
        rattleProgress > 0 ? Math.max(0, Math.sin((rattleProgress * 14 + rattleSeed) * Math.PI)) * rattleEnergy : 0
      const settleWobble = Math.sin(settleProgress * Math.PI * 5) * Math.pow(1 - settleProgress, 2.4)
      const trackProgress = easeOutCubic(clamp(progress / 0.44, 0, 1))
      const pocketDrop = smootherStep(pocketProgress)
      const angle = startAngle + angularDistance * distanceProgress
      const radius =
        lerp(BALL_START_RADIUS, BALL_TRACK_RADIUS, trackProgress) -
        (BALL_TRACK_RADIUS - BALL_POCKET_RADIUS) * pocketDrop +
        deflectorHit * 3.7 +
        Math.abs(settleWobble) * 1.1
      const scale = 1 - pocketDrop * 0.11 + deflectorHit * 0.052
      const trail = clamp(0.08 + Math.pow(1 - progress, 0.7) * 0.48 - pocketProgress * 0.38, 0, 0.54)
      const pocket = getPocketIndex(angle)
      const minPocketSoundGap = 24 + progress * 48

      if (pocket !== lastPocketRef.current && now - lastPocketSoundAtRef.current > minPocketSoundGap) {
        playSound('pocket', soundOnRef.current, progress)
        lastPocketRef.current = pocket
        lastPocketSoundAtRef.current = now
      }

      angleRef.current = angle
      setBall({ angle, radius, scale, trail })

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(animate)
        return
      }

      angleRef.current = targetAngle
      setBall({
        angle: targetAngle,
        radius: BALL_POCKET_RADIUS,
        scale: 0.88,
        trail: 0,
      })
    }

    frameRef.current = window.requestAnimationFrame(animate)

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [result, spinIndex, targetAngle])

  const ballStyle = {
    '--ball-trail': ball.trail.toFixed(3),
    transform: `scale(${ball.scale})`,
  } as CSSProperties

  return (
    <section className="wheel-stage" aria-label="Roulette wheel">
      <div className="wheel-pointer" />
      <div className="roulette-wheel">
        <img className="roulette-wheel-art" src="/images/roulette/roulette-wheel-art.svg" alt="" draggable="false" />
        <div className="wheel-track" />
        <img className="roulette-center-art" src="/images/roulette/center.svg" alt="" draggable="false" />
      </div>
      <div className="roulette-ball-orbit" style={{ transform: `rotate(${ball.angle}deg) translateY(-${ball.radius}px)` }}>
        <span className={isSpinning ? 'roulette-ball is-spinning' : 'roulette-ball'} style={ballStyle}>
          <span className="roulette-ball-core">
            <i />
          </span>
        </span>
      </div>
    </section>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3)
}

function easeOutPower(value: number, power: number) {
  return 1 - Math.pow(1 - value, power)
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress
}

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360
}

function getPocketIndex(angle: number) {
  return Math.floor(normalizeAngle(angle) / (360 / EUROPEAN_WHEEL_ORDER.length))
}

function smootherStep(value: number) {
  return value * value * value * (value * (value * 6 - 15) + 10)
}
