import { z } from 'zod'

export const UserSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'Your username must be at least 3 characters long' })
    .max(20, { message: 'Your username cannot be longer than 20 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message:
        'Your username can only contain letters, numbers, and underscores',
    }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(8, { message: 'Your password must be at least 8 characters long' })
    .max(72, {
      message: 'Your password is too long. Please use 72 characters or less',
    })
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      {
        message:
          'Your password must include at least one uppercase letter, one lowercase letter, one number, and one special character (like @, $, !, %, *, ?, or &)',
      }
    ),
  name: z
    .string()
    .min(2, { message: 'Your name must be at least 2 characters long' })
    .max(50, { message: 'Your name cannot be longer than 50 characters' }),
})

export const SignInSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'Your username must be at least 3 characters long' })
    .max(20, { message: 'Your username cannot be longer than 20 characters' }),
  password: z
    .string()
    .min(8, { message: 'Your password must be at least 8 characters long' })
    .max(72, {
      message: 'Your password is too long. Please use 72 characters or less',
    }),
})

export const CreateRoomSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'The room name must be at least 3 characters long' })
    .max(20, { message: 'The room name cannot be longer than 20 characters' })
    .regex(/^[a-zA-Z0-9\s]+$/, {
      message: 'The room name can only contain letters, numbers, and spaces',
    }),
})

export const UpdateRoomSchema = z
  .object({
    name: z
      .string()
      .min(3, { message: 'The room name must be at least 3 characters long' })
      .max(20, { message: 'The room name cannot be longer than 20 characters' })
      .regex(/^[a-zA-Z0-9\s]+$/, {
        message: 'The room name can only contain letters, numbers, and spaces',
      })
      .optional(),
    maxParticipants: z
      .number()
      .int()
      .min(1, { message: 'The room must allow at least 1 participant' })
      .max(50, { message: 'The room cannot have more than 50 participants' })
      .optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

export const UpdateUserSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: 'Your username must be at least 3 characters long' })
      .max(20, { message: 'Your username cannot be longer than 20 characters' })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message:
          'Your username can only contain letters, numbers, and underscores',
      })
      .optional(),
    email: z
      .string()
      .email({ message: 'Please enter a valid email address' })
      .optional(),
    name: z
      .string()
      .min(2, { message: 'Your name must be at least 2 characters long' })
      .max(50, { message: 'Your name cannot be longer than 50 characters' })
      .optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

export type User = z.infer<typeof UserSchema>
export type SignInCredentials = z.infer<typeof SignInSchema>
export type CreateRoomData = z.infer<typeof CreateRoomSchema>
export type UpdateRoomData = z.infer<typeof UpdateRoomSchema>
export type UpdateUserData = z.infer<typeof UpdateUserSchema>
