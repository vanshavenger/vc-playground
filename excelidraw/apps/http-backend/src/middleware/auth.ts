import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '@repo/backend-config/config'
import { CustomError } from '../utils/custom-error.js'

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
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      throw new CustomError('No authorization header', 401)
    }

    const [type, token] = authHeader.split(' ')
    if (type !== 'Bearer' || !token) {
      throw new CustomError('Invalid authorization format', 401)
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload

      if (!decoded || typeof decoded === 'string' || !decoded.userID) {
        throw new CustomError('Invalid token payload', 401)
      }

      req.userID = decoded.userID
      next()
    } catch (jwtError) {
      if (jwtError instanceof jwt.JsonWebTokenError) {
        throw new CustomError('Invalid token', 401)
      } else if (jwtError instanceof jwt.TokenExpiredError) {
        throw new CustomError('Token expired', 401)
      } else {
        throw jwtError
      }
    }
  } catch (error) {
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Internal server error' })
    }
  }
}
