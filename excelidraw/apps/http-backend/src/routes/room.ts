import express from 'express'
import {
  createRoom,
  getLast50ChatMessages,
} from '../controllers/room-controller.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.post('/create', authMiddleware, createRoom)
router.get('/chat', authMiddleware, getLast50ChatMessages)

export const roomRoutes = router
