import { Request, Response, NextFunction } from 'express'
import { UserSchema, SignInSchema } from '@repo/config/types'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { BCRYPT_SALT, JWT_SECRET } from '@repo/backend-config/config'
import { CustomError } from '../utils/custom-error.js'

const prisma = new PrismaClient()

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await UserSchema.parseAsync(req.body)

    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT)

    const dbResponse = await prisma.user.create({
      data: {
        ...data,
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
    const data = await SignInSchema.parseAsync(req.body)

    const user = await prisma.user.findUnique({
      where: { username: data.username },
    })

    if (!user) {
      throw new CustomError('User not found', 404)
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password)

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
