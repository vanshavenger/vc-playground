import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import { createServer } from 'http'
import cors from 'cors'
import 'dotenv/config'

import { CONFIG } from './constants'
import { authMiddleware } from './middleware/auth'
import {
  CreateRoomSchema,
  UserSchema,
  SignInSchema,
} from '@repo/config/types'
import { PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.post('/signup', async (req: Request, res: Response) => {
  try {
    res.status(201).json({ message: 'Sign up successful' })
  } catch (error) {
    res.status(500).json({
      message: 'Error signing up',
      error: (error as Error).message,
    })
  }
})

app.get('/signin', async (req, res) => {
  try {
    res.status(200).json({ message: 'Sign in successful' })
  } catch (error) {
    res.status(500).json({
      message: 'Error signing in',
      error: (error as Error).message,
    })
  }
})

app.post(
  '/create-room',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      res
        .status(201)
        .json({ message: 'Room created successfully', userId: req.userID })
    } catch (error) {
      res.status(500).json({
        message: 'Error creating room',
        error: (error as Error).message,
      })
    }
  }
)

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong' })
})

const server = createServer(app)

server.listen(CONFIG.PORT, () => {
  console.log(`Server is running on port ${CONFIG.PORT}`)
})

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

function gracefulShutdown() {
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
