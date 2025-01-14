import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import jwt from 'jsonwebtoken'
import { JWT_SECRET, WS_BACKEND_PORT } from '@repo/backend-config/config'

const server = createServer()
const wss = new WebSocketServer({ server })

const port = WS_BACKEND_PORT

interface ExtWebSocket extends WebSocket {
  userID?: string
  roomId?: string
}

interface Room {
  id: string
  users: Set<string>
  drawingData: any[]
}

const rooms: Map<string, Room> = new Map()

wss.on('connection', (ws: ExtWebSocket) => {
  console.log('Client connected')

  ws.on('message', (message: string) => {
    const data = JSON.parse(message)

    switch (data.type) {
      case 'auth':
        handleAuth(ws, data.token)
        break
      case 'join_room':
        handleJoinRoom(ws, data.roomId)
        break
      case 'leave_room':
        handleLeaveRoom(ws)
        break
      case 'draw':
        handleDraw(ws, data.drawingData)
        break
      default:
        console.warn('Unknown message type:', data.type)
    }
  })

  ws.on('close', () => {
    handleLeaveRoom(ws)
    console.log('Client disconnected')
  })
})

function handleAuth(ws: ExtWebSocket, token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userID: string }
    ws.userID = decoded.userID
    ws.send(JSON.stringify({ type: 'auth', success: true }))
  } catch (error) {
    ws.send(
      JSON.stringify({ type: 'auth', success: false, error: 'Invalid token' })
    )
  }
}

function handleJoinRoom(ws: ExtWebSocket, roomId: string) {
  if (!ws.userID) {
    ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
    return
  }

  let room = rooms.get(roomId)
  if (!room) {
    room = { id: roomId, users: new Set(), drawingData: [] }
    rooms.set(roomId, room)
  }

  room.users.add(ws.userID)
  ws.roomId = roomId

  ws.send(
    JSON.stringify({
      type: 'room_joined',
      roomId,
      drawingData: room.drawingData,
    })
  )
  broadcastToRoom(roomId, { type: 'user_joined', userID: ws.userID })
}

function handleLeaveRoom(ws: ExtWebSocket) {
  if (ws.roomId && ws.userID) {
    const room = rooms.get(ws.roomId)
    if (room) {
      room.users.delete(ws.userID)
      broadcastToRoom(ws.roomId, { type: 'user_left', userID: ws.userID })
      if (room.users.size === 0) {
        rooms.delete(ws.roomId)
      }
    }
    ws.roomId = undefined
  }
}

function handleDraw(ws: ExtWebSocket, drawingData: any) {
  if (!ws.userID || !ws.roomId) {
    ws.send(
      JSON.stringify({
        type: 'error',
        message: 'Not authenticated or not in a room',
      })
    )
    return
  }

  const room = rooms.get(ws.roomId)
  if (room) {
    const drawEvent = {
      type: 'draw',
      userID: ws.userID,
      drawingData,
    }
    room.drawingData.push(drawEvent)
    broadcastToRoom(ws.roomId, drawEvent)
  }
}

function broadcastToRoom(roomId: string, message: any) {
  wss.clients.forEach((client: ExtWebSocket) => {
    if (client.roomId === roomId) {
      client.send(JSON.stringify(message))
    }
  })
}

server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`)
})
