type SoundName = 'chip' | 'clear' | 'lose' | 'pocket' | 'spin' | 'win'

let audioContext: AudioContext | null = null

export function playSound(name: SoundName, enabled: boolean, amount = 0) {
  if (!enabled) return

  const context = getAudioContext()
  if (!context) return

  if (context.state === 'suspended') {
    void context.resume()
  }

  if (name === 'chip') playChip(context)
  if (name === 'clear') playClear(context)
  if (name === 'pocket') playPocket(context, amount)
  if (name === 'spin') playSpin(context)
  if (name === 'win') playWin(context)
  if (name === 'lose') playLose(context)
}

function getAudioContext() {
  if (audioContext) return audioContext

  const AudioContextCtor =
    window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!AudioContextCtor) return null

  audioContext = new AudioContextCtor()
  return audioContext
}

function tone(context: AudioContext, frequency: number, start: number, duration: number, gain = 0.06, type: OscillatorType = 'sine') {
  const oscillator = context.createOscillator()
  const volume = context.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  volume.gain.setValueAtTime(0.0001, start)
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.01)
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  oscillator.connect(volume)
  volume.connect(context.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

function sweep(
  context: AudioContext,
  from: number,
  to: number,
  start: number,
  duration: number,
  gain = 0.04,
  type: OscillatorType = 'sine',
) {
  const oscillator = context.createOscillator()
  const volume = context.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(from, start)
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration)
  volume.gain.setValueAtTime(0.0001, start)
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.03)
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  oscillator.connect(volume)
  volume.connect(context.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.03)
}

function playChip(context: AudioContext) {
  const now = context.currentTime
  tone(context, 620, now, 0.09, 0.05, 'triangle')
  tone(context, 940, now + 0.035, 0.08, 0.035, 'sine')
}

function playClear(context: AudioContext) {
  const now = context.currentTime
  tone(context, 360, now, 0.07, 0.035, 'square')
  tone(context, 240, now + 0.055, 0.1, 0.03, 'triangle')
}

function playSpin(context: AudioContext) {
  const now = context.currentTime
  sweep(context, 180, 82, now, 1.45, 0.026, 'sine')
  sweep(context, 520, 260, now + 0.04, 0.8, 0.012, 'triangle')
}

function playPocket(context: AudioContext, amount: number) {
  const now = context.currentTime
  const progress = Math.min(Math.max(amount, 0), 1)
  const frequency = 980 - progress * 440
  const gain = 0.026 - progress * 0.01
  const duration = 0.018 + progress * 0.026

  tone(context, frequency, now, duration, Math.max(0.012, gain), 'triangle')
  if (progress > 0.68) {
    tone(context, 260 - progress * 45, now + 0.012, 0.04, 0.009, 'sine')
  }
}

function playWin(context: AudioContext) {
  const now = context.currentTime
  ;[540, 680, 860, 1080].forEach((frequency, index) => {
    tone(context, frequency, now + index * 0.09, 0.16, 0.055, 'triangle')
  })
}

function playLose(context: AudioContext) {
  const now = context.currentTime
  tone(context, 260, now, 0.13, 0.04, 'sine')
  tone(context, 190, now + 0.1, 0.16, 0.035, 'sine')
}
