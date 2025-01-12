import { WebSocketServer, WebSocket } from 'ws'
import { CONFIG, EVENTS } from './constants.js'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '@repo/backend-config/config'

interface DecodedToken {
  userID: string
  [key: string]: any
}

const wss = new WebSocketServer({ port: CONFIG.PORT })

wss.on(EVENTS.CONNECTION, (ws: WebSocket, request) => {
  console.log('New client connection attempt')

  try {
    const authHeader = request.headers['authorization']

    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const [type, token] = authHeader.split(' ')

    if (type !== 'Bearer' || !token) {
      throw new Error('Invalid authorization format')
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken

    if (!decoded || !decoded.userID) {
      throw new Error('Invalid token payload')
    }

    console.log(`Client authenticated: ${decoded.userID}`)

    ws.on(EVENTS.MESSAGE, data => {
      console.log(`Received from ${decoded.userID}:`, data.toString())
      ws.send(`Server received: ${data}`)
    })

    ws.on(EVENTS.CLOSE, () => {
      console.log(`Client disconnected: ${decoded.userID}`)
    })

    ws.on(EVENTS.ERROR, (error: Error) => {
      console.error(`WebSocket error for ${decoded.userID}:`, error)
    })
  } catch (error) {
    console.error('Authentication error:', error)
    ws.close(1008, 'Authentication failed')
  }
})

wss.on('error', (error: Error) => {
  console.error('WebSocket server error:', error)
})


console.log(`WebSocket server is running on ws://${CONFIG.HOST}:${CONFIG.PORT}`)
