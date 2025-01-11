import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import { createServer } from 'http'
import cors from 'cors'
import 'dotenv/config'

import { CONFIG } from './constants.js'
import { authMiddleware } from './middleware/auth.js'
import { BCRYPT_SALT } from '@repo/backend-config/config'
import { CreateRoomSchema, UserSchema, SignInSchema } from '@repo/config/types'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '@repo/backend-config/config'

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
    const data = await UserSchema.safeParseAsync(req.body)
    if (!data.success) {
      res.status(400).json({ message: 'Invalid data' })
      return
    }

    const { name, password, username, email } = data.data

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT)

    const dbResponse = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        username,
      },
    })

    res
      .status(201)
      .json({ message: 'User created successfully', userID: dbResponse.id })
  } catch (error) {
    res.status(500).json({
      message: 'Error signing up',
      error: (error as Error).message,
    })
  }
})

app.get('/signin', async (req, res) => {
  try {
    const data = await SignInSchema.safeParseAsync(req.body)

    if (!data.success) {
      res.status(400).json({ message: 'Invalid data' })
      return
    }

    const { username, password } = data.data

    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const jwtToken = jwt.sign({ userID: user.id }, JWT_SECRET)

    res.status(200).json({ message: 'Signed in successfully', token: jwtToken })
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
      const data = await CreateRoomSchema.safeParseAsync(req.body)

      if (!data.success) {
        res.status(400).json({ message: 'Invalid data' })
        return
      }

      const { name } = data.data

      const dbResponse = await prisma.room.create({
        data: {
          name,
          ownerId: req.userID,
        },
      })

      res
        .status(201)
        .json({ message: 'Room created successfully', roomID: dbResponse.id })
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
