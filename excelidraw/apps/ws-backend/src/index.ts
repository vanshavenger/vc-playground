import { WebSocketServer } from 'ws'
import { CONFIG, EVENTS } from './constants.js'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '@repo/backend-config/config'

const wss = new WebSocketServer({ port: CONFIG.PORT })

wss.on(EVENTS.CONNECTION, (ws, request) => {
  console.log('New client connected')

  const authHeader = request.headers.authorization

  if (!authHeader) {
    ws.send('No authorization header')
    ws.close()
    return
  }

  const [type, token] = authHeader.split(' ')

  if (type !== 'Bearer' || !token) {
    ws.send('Invalid authorization format')
    ws.close()
    return
  }

  const decoded = jwt.verify(token, JWT_SECRET)

  if (!decoded || typeof decoded === 'string' || !decoded.userID) {
    ws.send('Invalid token payload')
    ws.close()
    return
  }

  ws.on(EVENTS.MESSAGE, data => {
    console.log('Received:', data.toString())
    ws.send(`Server received: ${data}`)
  })

  ws.on(EVENTS.CLOSE, () => {
    console.log('Client disconnected')
  })

  ws.on(EVENTS.ERROR, error => {
    console.error('WebSocket error:', error)
  })
})

console.log(`WebSocket server is running on ws://${CONFIG.HOST}:${CONFIG.PORT}`)
