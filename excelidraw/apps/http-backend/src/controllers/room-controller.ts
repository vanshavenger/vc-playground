import { Request, Response, NextFunction } from 'express'
import { CreateRoomSchema } from '@repo/config/types'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const createRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await CreateRoomSchema.parseAsync(req.body)

    const dbResponse = await prisma.room.create({
      data: {
        name: data.name,
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
