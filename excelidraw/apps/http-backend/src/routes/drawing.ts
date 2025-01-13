import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { getDrawing } from '../controllers/drawing-controller.js'

const router = express.Router()

router.get('/:roomID', authMiddleware, getDrawing)

export const drawingRoutes = router
