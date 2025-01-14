import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { HTTP_BACKEND_PORT, WS_BACKEND_PORT } from '@repo/backend-config/config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const HTTP_BACKEND_BASE_URL = `http://localhost:${HTTP_BACKEND_PORT}`

export const WS_BACKEND_BASE_URL = `ws://localhost:${WS_BACKEND_PORT}`
