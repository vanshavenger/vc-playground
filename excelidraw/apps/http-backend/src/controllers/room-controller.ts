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

export const getLast50ChatMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roomID } = req.query

    if (!roomID) {
      throw new CustomError('Room ID is required', 400)
    }

    const messages = await prisma.chat.findMany({
      where: {
        roomId: roomID.toString(),
      },
      take: 50,
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.status(200).json(messages)
  } catch (error) {
    next(error)
  }
}

export const getRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomID } = req.params

    if (!roomID) {
      throw new CustomError('Room ID is required', 400)
    }

    const room = await prisma.room.findUnique({
      where: { id: roomID },
    })

    if (!room) {
      throw new CustomError('Room not found', 404)
    }

    res.status(200).json(room)
  } catch (error) {
    next(error)
  }
}
