import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { CustomError } from '../utils/custom-error.js'

const prisma = new PrismaClient()

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roomID } = req.params
    const { page = 1, limit = 50 } = req.query

    const messages = await prisma.message.findMany({
      where: { roomId: roomID },
      include: { user: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    })

    res.status(200).json(messages)
  } catch (error) {
    next(error)
  }
}
