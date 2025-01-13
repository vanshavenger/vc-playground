import { Request, Response, NextFunction } from 'express'
import { UpdateUserSchema } from '@repo/config/types'
import { PrismaClient } from '@prisma/client'
import { CustomError } from '../utils/custom-error.js'

const prisma = new PrismaClient()

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userID },
      select: { id: true, username: true, email: true, createdAt: true },
    })

    if (!user) {
      throw new CustomError('User not found', 404)
    }

    res.status(200).json(user)
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await UpdateUserSchema.safeParseAsync(req.body)

    if (!data.success) {
      throw new CustomError(data.error.message, 400)
    }

    const { username, email } = data.data

    const updatedUser = await prisma.user.update({
      where: { id: req.userID },
      data: { username, email },
      select: { id: true, username: true, email: true, createdAt: true },
    })

    res.status(200).json(updatedUser)
  } catch (error) {
    next(error)
  }
}
