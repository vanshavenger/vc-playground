import { WS_BACKEND_PORT } from '@repo/backend-config/config'

export const CONFIG = {
  PORT: WS_BACKEND_PORT || 8080,
  HOST: 'localhost',
} as const

export const EVENTS = {
  CONNECTION: 'connection',
  MESSAGE: 'message',
  CLOSE: 'close',
  ERROR: 'error',
} as const
