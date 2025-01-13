import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { getMessages } from '../controllers/chat-controller.js'

const router = express.Router()

router.get('/:roomId', authMiddleware, getMessages)

export const chatRoutes = router
