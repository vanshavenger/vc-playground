import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { CustomError } from '../utils/custom-error.js'

const prisma = new PrismaClient()

export const getDrawing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roomID } = req.params

    const drawing = await prisma.drawing.findFirst({
      where: { roomId: roomID },
      orderBy: { createdAt: 'desc' },
    })

    if (!drawing) {
      throw new CustomError('No drawing found for this room', 404)
    }

    res.status(200).json(drawing)
  } catch (error) {
    next(error)
  }
}
