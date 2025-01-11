import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import { JWT_SECRET } from '@repo/backend-config/config'

declare global {
  namespace Express {
    interface Request {
      userID: string
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization
  if (!token) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const [type, value] = token.split(' ')
  if (type !== 'Bearer') {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  if (!value) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  try {
    const decoded = jwt.verify(value, JWT_SECRET)

    if (typeof decoded === 'string') {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    if (!decoded || !decoded.userID) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    req.userID = decoded.userID
    next()
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' })
  }
}
