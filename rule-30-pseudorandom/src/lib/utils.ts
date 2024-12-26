import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const generateSeedRow = (length: number): boolean[] => {
  const timestamp = Date.now()
  return Array.from({ length }).map((_, i) => {
    return ((timestamp >> i) & 1) === 1
  })
}

export const generateWithoutSeedRow = (length: number): boolean[] => {
  return Array.from({ length }).map((_, i) => (
    Math.floor(length / 2) === i
  ))
}

export const applyRule30 = (prevRow: boolean[]): boolean[] => {
  return prevRow.map((_, i) => {
    const left = i === 0 ? prevRow[prevRow.length - 1] : prevRow[i - 1]
    const right = i === prevRow.length - 1 ? prevRow[0] : prevRow[i + 1]
    const center = prevRow[i]
    return left !== (center || right)
  })
}