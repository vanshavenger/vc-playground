import { Request, Response, NextFunction } from 'express'
import { CreateRoomSchema } from '@repo/config/types'
import { PrismaClient } from '@prisma/client'
import { CustomError } from '../utils/custom-error.js'

const prisma = new PrismaClient()

export const createRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await CreateRoomSchema.safeParseAsync(req.body)

    if (!data.success) {
      throw new CustomError(data.error.message, 400)
    }

    const { name } = data.data

    const dbResponse = await prisma.room.create({
      data: {
        name: name,
        ownerId: req.userID,
      },
    })

    res
      .status(201)
      .json({ message: 'Room created successfully', roomID: dbResponse.id })
  } catch (error) {
    next(error)
  }
}
