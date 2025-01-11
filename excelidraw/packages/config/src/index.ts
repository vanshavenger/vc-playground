import { z } from 'zod'

export const UserSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string(),
  name: z.string(),
})

export const SignInSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string(),
})

export const CreateRoomSchema = z.object({
  name: z.string().min(3).max(20),
})
