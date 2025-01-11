import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import { createServer } from 'http'
import cors from 'cors'
import 'dotenv/config'
import helmet from 'helmet'
import { Server } from 'http'
import { CONFIG } from './constants.js'
import { authRoutes } from './routes/auth.js'
import { roomRoutes } from './routes/room.js'
import { notFoundHandler } from './middleware/not-found-handler.js'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/room', roomRoutes)

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use(notFoundHandler)

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong' })
})

const server = createServer(app)

server.listen(CONFIG.PORT, () => {
  console.log(`Server is running on port ${CONFIG.PORT}`)
})

process.on('SIGTERM', () => gracefulShutdown(server))
process.on('SIGINT', () => gracefulShutdown(server))

function gracefulShutdown(server: Server) {
  console.log('Received shutdown signal')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })

  setTimeout(() => {
    console.error(
      'Could not close connections in time, forcefully shutting down'
    )
    process.exit(1)
  }, CONFIG.SHUTDOWN_TIMEOUT)
}

export default server
