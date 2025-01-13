import { Request, Response, NextFunction } from 'express'
import { UserSchema, SignInSchema } from '@repo/config/types'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '@repo/backend-config/config'
import { CustomError } from '../utils/custom-error.js'
import argon2 from 'argon2'

const prisma = new PrismaClient()

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await UserSchema.safeParseAsync(req.body)

    if (!data.success) {
      throw new CustomError(data.error.message, 400)
    }

    const { password, ...userData } = data.data

    const hashedPassword = await argon2.hash(password)

    const dbResponse = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    })

    res
      .status(201)
      .json({ message: 'User created successfully', userID: dbResponse.id })
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      next(new CustomError('Username or email already exists', 409))
    } else {
      next(error)
    }
  }
}

export const signin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await SignInSchema.safeParseAsync(req.body)

    if (!data.success) {
      throw new CustomError(data.error.message, 400)
    }

    const { username, password } = data.data

    const user = await prisma.user.findUnique({
      where: { username: username },
    })

    if (!user) {
      throw new CustomError('User not found', 404)
    }

    const passwordMatch = await argon2.verify(user.password, password)

    if (!passwordMatch) {
      throw new CustomError('Invalid credentials', 401)
    }

    const jwtToken = jwt.sign({ userID: user.id }, JWT_SECRET, {
      expiresIn: '1h',
    })

    res.status(200).json({ message: 'Signed in successfully', token: jwtToken })
  } catch (error) {
    next(error)
  }
}
