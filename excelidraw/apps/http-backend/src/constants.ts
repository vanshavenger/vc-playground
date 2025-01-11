import { HTPP_BACKEND_PORT } from '@repo/backend-config/config'

export const CONFIG = {
  PORT: HTPP_BACKEND_PORT || 8081,
  SHUTDOWN_TIMEOUT: 10000,
}
