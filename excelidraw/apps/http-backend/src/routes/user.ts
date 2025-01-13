import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { getProfile, updateProfile } from '../controllers/user-controller.js'

const router = express.Router()

router.get('/profile', authMiddleware, getProfile)
router.put('/profile', authMiddleware, updateProfile)

export const userRoutes = router
