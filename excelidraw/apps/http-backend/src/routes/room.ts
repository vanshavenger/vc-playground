import express from 'express'
import {
  createRoom,
  deleteRoom,
  getRoom,
  listRooms,
  updateRoom,
} from '../controllers/room-controller.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.post('/', authMiddleware, createRoom)
router.get('/:id', authMiddleware, getRoom)
router.get('/', authMiddleware, listRooms)
router.put('/:id', authMiddleware, updateRoom)
router.delete('/:id', authMiddleware, deleteRoom)

export const roomRoutes = router
