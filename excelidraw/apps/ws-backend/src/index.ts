import { WebSocketServer, WebSocket, RawData } from 'ws'
import { CONFIG, EVENTS, MESSAGE_TYPES } from './constants.js'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '@repo/backend-config/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DecodedToken {
  userID: string
  [key: string]: any
}

interface UserRoom {
  ws: WebSocket
  userID: string
  roomIDs: string[]
}

interface Message {
  type: string
  roomID?: string
  content?: string
}

const userRooms: UserRoom[] = []
const wss = new WebSocketServer({ port: CONFIG.PORT })

function joinRoom(userID: string, roomID: string, ws: WebSocket) {
  const userRoom = userRooms.find(ur => ur.userID === userID)
  if (userRoom) {
    if (!userRoom.roomIDs.includes(roomID)) {
      userRoom.roomIDs.push(roomID)
    }
  } else {
    userRooms.push({ ws, userID, roomIDs: [roomID] })
  }
  console.log(`User ${userID} joined room ${roomID}`)
}

function leaveRoom(userID: string, roomID: string) {
  const userRoomIndex = userRooms.findIndex(ur => ur.userID === userID)
  if (userRoomIndex !== -1) {
    const userRoom = userRooms[userRoomIndex]
    if (userRoom) {
      userRoom.roomIDs = userRoom.roomIDs.filter(id => id !== roomID)
      console.log(`User ${userID} left room ${roomID}`)
      if (userRoom.roomIDs.length === 0) {
        userRooms.splice(userRoomIndex, 1)
        console.log(`User ${userID} removed from userRooms (no rooms left)`)
      }
    }
  }
}

async function sendMessageToRoom(senderID: string, roomID: string, message: string) {
  await prisma.chat.create({
    data: {
      message,
      senderId: senderID,
      roomId: roomID,

    }
  })
  userRooms.forEach(ur => {
    if (ur.roomIDs.includes(roomID) && ur.userID !== senderID) {
      ur.ws.send(
        JSON.stringify({
          type: MESSAGE_TYPES.MESSAGE,
          roomID,
          senderID,
          content: message,
        })
      )
    }
  })
}

wss.on(EVENTS.CONNECTION, (ws: WebSocket, request) => {
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

    ws.on(EVENTS.MESSAGE, async (data: RawData) => {
      try {
        const message: Message = JSON.parse(data.toString())

        switch (message.type) {
          case MESSAGE_TYPES.JOIN:
            if (message.roomID) {
              joinRoom(decoded.userID, message.roomID, ws)
            }
            break
          case MESSAGE_TYPES.LEAVE:
            if (message.roomID) {
              leaveRoom(decoded.userID, message.roomID)
            }
            break
          case MESSAGE_TYPES.MESSAGE:
            if (message.roomID && message.content) {
              await sendMessageToRoom(decoded.userID, message.roomID, message.content)
            }
            break
          default:
            console.warn(
              `Unknown message type received from ${decoded.userID}:`,
              message.type
            )
        }
      } catch (error) {
        console.error(`Error processing message from ${decoded.userID}:`, error)
      }
    })

    ws.on(EVENTS.CLOSE, () => {
      console.log(`Client disconnected: ${decoded.userID}`)
      const userRoomIndex = userRooms.findIndex(
        ur => ur.userID === decoded.userID
      )
      if (userRoomIndex !== -1) {
        userRooms.splice(userRoomIndex, 1)
        console.log(`User ${decoded.userID} removed from all rooms`)
      }
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
