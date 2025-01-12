import express from 'express'
import {
  createRoom,
  getLast50ChatMessages,
  getRoom,
} from '../controllers/room-controller.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.post('/create', authMiddleware, createRoom)
router.get('/chat', authMiddleware, getLast50ChatMessages)
router.get("/getroom:id", authMiddleware, getRoom)

export const roomRoutes = router
