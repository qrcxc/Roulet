import type { ChipValue } from '../types'

const CHIP_IMAGES: Record<ChipValue, string> = {
  1: '/images/roulette/chips/chip-1.svg',
  5: '/images/roulette/chips/chip-5.svg',
  25: '/images/roulette/chips/chip-25.svg',
  50: '/images/roulette/chips/chip-50.svg',
  250: '/images/roulette/chips/chip-250.svg',
  500: '/images/roulette/chips/chip-500.svg',
  2000: '/images/roulette/chips/chip-2k.svg',
  5000: '/images/roulette/chips/chip-5k.svg',
  25000: '/images/roulette/chips/chip25k.svg',
  50000: '/images/roulette/chips/chip-50k.svg',
}

const CHIP_STEPS = Object.keys(CHIP_IMAGES)
  .map(Number)
  .sort((a, b) => b - a) as ChipValue[]

export function getChipImage(value: number): string {
  return CHIP_IMAGES[CHIP_STEPS.find((chip) => value >= chip) ?? 1]
}

export function getChipLabel(value: number): string {
  if (value >= 1000) return `${value / 1000}K`
  return String(value)
}
