import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { CustomError } from '../utils/custom-error.js'
import { logger } from '../utils/logger.js'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err)

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors,
    })
  }

  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({ message: err.message })
  }

  res.status(500).json({ message: 'Something went wrong' })
}
