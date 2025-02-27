import { z } from 'zod'
import { userIdSchema } from './user.schemas'

export const gameIdSchema = z.string()

export const BallSchema = z.object({
    dirX: z.number(),
    dirY: z.number(),
    x: z.number(),
    y: z.number(),
    speed: z.number()
})

export const gameBallDtoSchema = z.object({
    gameId: gameIdSchema,
    ball: BallSchema
})

export const gamePaddleDtoSchema = z.object({
    gameId: gameIdSchema,
    myPaddlePos: z.number()
})

export const sideDtoSchema = z.object({
    gameId: gameIdSchema,
})

export const gameDtoSchema = z.object({
    gameId: gameIdSchema,
    playerOne: userIdSchema
})

export const endGameDtoSchema = z.object({
    gameId: gameIdSchema,
    won: z.boolean(),
    looserScore: z.number()
})

export const newGameDtoSchema = z.object({
    winScore: z.number(),
})

export const gameSettingsDtoSchema = z.object({
	winScore: z.number(),
	paddleSize: z.optional(z.number()),
	paddleSpeed: z.optional(z.number()),
	ballSize: z.optional(z.number()),
	ballSpeed: z.optional(z.number()),
	speedIncrease: z.optional(z.number()),
	gameColor: z.optional(z.string()),
})

export const inviteGameDtoSchema = z.object({
    opponentId: userIdSchema,
    settings: gameSettingsDtoSchema
})
