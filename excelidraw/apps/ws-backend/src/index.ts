import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { JWT_SECRET, WS_BACKEND_PORT } from '@repo/backend-config/config'

const server = createServer()
const wss = new WebSocketServer({ server })
const prisma = new PrismaClient()

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

  ws.on('message', async (message: string) => {
    const data = JSON.parse(message)

    switch (data.type) {
      case 'auth':
        handleAuth(ws, data.token)
        break
      case 'join_room':
        await handleJoinRoom(ws, data.roomId)
        break
      case 'leave_room':
        await handleLeaveRoom(ws)
        break
      case 'draw':
        await handleDraw(ws, data.drawingData)
        break
      case 'add_shape':
        await handleAddShape(ws, data.shapeData)
        break
      case 'erase':
        await handleErase(ws, data.eraseData)
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

async function handleJoinRoom(ws: ExtWebSocket, roomId: string) {
  if (!ws.userID) {
    ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
    return
  }

  let room = rooms.get(roomId)
  if (!room) {
    const dbRoom = await prisma.room.findUnique({
      where: { id: roomId },
      include: { drawings: true },
    })

    if (!dbRoom) {
      ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }))
      return
    }

    room = {
      id: roomId,
      users: new Set(),
      drawingData: dbRoom.drawings.map(d => JSON.parse(d.data as string)),
    }
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

async function handleLeaveRoom(ws: ExtWebSocket) {
  if (ws.roomId && ws.userID) {
    const room = rooms.get(ws.roomId)
    if (room) {
      room.users.delete(ws.userID)
      broadcastToRoom(ws.roomId, { type: 'user_left', userID: ws.userID })
      if (room.users.size === 0) {
        await saveRoomDrawings(ws.roomId, room.drawingData)
        rooms.delete(ws.roomId)
      }
    }
    ws.roomId = undefined
  }
}

async function handleDraw(ws: ExtWebSocket, drawingData: any) {
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
    const drawEvent = { type: 'draw', userID: ws.userID, drawingData }
    room.drawingData.push(drawEvent)
    broadcastToRoom(ws.roomId, drawEvent)
    await saveDrawing(ws.roomId, ws.userID, drawEvent)
  }
}

async function handleAddShape(ws: ExtWebSocket, shapeData: any) {
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
    const shapeEvent = { type: 'add_shape', userID: ws.userID, shapeData }
    room.drawingData.push(shapeEvent)
    broadcastToRoom(ws.roomId, shapeEvent)
    await saveDrawing(ws.roomId, ws.userID, shapeEvent)
  }
}

async function handleErase(ws: ExtWebSocket, eraseData: any) {
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
    const eraseEvent = { type: 'erase', userID: ws.userID, eraseData }
    room.drawingData.push(eraseEvent)
    broadcastToRoom(ws.roomId, eraseEvent)
    await saveDrawing(ws.roomId, ws.userID, eraseEvent)
  }
}

function broadcastToRoom(roomId: string, message: any) {
  wss.clients.forEach((client: ExtWebSocket) => {
    if (client.roomId === roomId) {
      client.send(JSON.stringify(message))
    }
  })
}

async function saveDrawing(roomId: string, userId: string, drawingData: any) {
  await prisma.drawing.create({
    data: {
      data: JSON.stringify(drawingData),
      roomId: roomId,
      userId: userId,
    },
  })
}

async function saveRoomDrawings(roomId: string, drawingData: any[]) {
  await prisma.drawing.deleteMany({ where: { roomId: roomId } })
  await prisma.drawing.createMany({
    data: drawingData.map(d => ({
      data: JSON.stringify(d),
      roomId: roomId,
      userId: d.userID,
    })),
  })
}

server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`)
})
