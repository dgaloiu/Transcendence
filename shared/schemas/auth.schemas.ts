import { z } from 'zod'
import { userIdSchema } from './user.schemas'

export const AuthUserSchema = z.object({
    id: userIdSchema,
    email: z.string().email(),
    intraLogin: z.string(),
    name: z.string(),
    doubleAuth: z.optional(z.boolean()),
    doubleAuthSecret: z.optional(z.string()),
    avatar: z.optional(z.string()),
    gameWon: z.optional(z.number()),
    gameLost: z.optional(z.number()),
})

export const JwtPayloadSchema = z.object({
	id: userIdSchema,
	name: z.string(),
	doubleAuth: z.boolean(),
})
