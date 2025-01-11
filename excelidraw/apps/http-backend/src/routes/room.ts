import express from 'express'
import { createRoom } from '../controllers/room-controller.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.post('/create', authMiddleware, createRoom)

export const roomRoutes = router
