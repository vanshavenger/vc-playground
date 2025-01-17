import { Request, Response, NextFunction } from 'express'
import { CreateRoomSchema, UpdateRoomSchema } from '@repo/config/types'
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

    res.status(201).json({
      message: 'Room created successfully',
      roomID: dbResponse.id,
      name: dbResponse.name,
    })
  } catch (error) {
    next(error)
  }
}

export const getRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

export const listRooms = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const rooms = await prisma.room.findMany({
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      orderBy: { createdAt: 'desc' },
    })
    res.status(200).json(rooms)
  } catch (error) {
    next(error)
  }
}

export const updateRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roomID } = req.params
    const data = await UpdateRoomSchema.safeParseAsync(req.body)

    if (!data.success) {
      throw new CustomError(data.error.message, 400)
    }

    const { name, maxParticipants } = data.data

    const room = await prisma.room.findUnique({
      where: { id: roomID },
    })

    if (!room) {
      throw new CustomError('Room not found', 404)
    }

    if (room.ownerId !== req.userID) {
      throw new CustomError('Only the room owner can update the room', 403)
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomID },
      data: { name, maxParticipants },
    })
    res.status(200).json(updatedRoom)
  } catch (error) {
    next(error)
  }
}

export const deleteRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params

    const room = await prisma.room.findUnique({
      where: { id: id },
    })

    if (!room) {
      throw new CustomError('Room not found', 404)
    }

    if (room.ownerId !== req.userID) {
      throw new CustomError('Only the room owner can delete the room', 403)
    }

    await prisma.room.delete({
      where: { id: id },
    })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
