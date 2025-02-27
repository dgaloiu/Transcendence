import { z } from 'zod';
import { userIdSchema } from './user.schemas';

export const roomIdSchema = z.string()
export const roomNameSchema = z.string()
export const RoomTypeSchema = z.enum([
    "PUBLIC",
    "PRIVATE",
    "PROTECTED",
    "P2P"
])

export const roomSettingsDtoSchema = z.object({
    id: roomIdSchema,
    name: z.optional(roomNameSchema),
    type: z.optional(RoomTypeSchema),
    oldPassword: z.optional(z.string()),
    password: z.optional(z.string()),
})

export const RoomDtoSchema = z.object({
    id: roomIdSchema,
    name: roomNameSchema,
    type: RoomTypeSchema
})

export const WhoDtoSchema = z.object({
    id: userIdSchema,
    name: z.optional(z.string()),
})

export const WhereDtoSchema = z.object({
    id: roomIdSchema,
    name: z.optional(z.string()),
})

export const MessageDtoSchema = z.object({
    id: z.optional(z.string()),
    from: WhoDtoSchema,
    to: WhereDtoSchema,
    message: z.string()
})

export const JoinDtoSchema = z.object({
    who: WhoDtoSchema,
    where: WhereDtoSchema,
    password: z.optional(z.string())
})

export const CreateRoomDtoSchema = z.object({
    name: z.string(),
    type: RoomTypeSchema,
    password: z.optional(z.string())
})

export const chatInteractionDtoSchema = z.object({
    from: WhoDtoSchema,
    to: z.optional(WhoDtoSchema),
    room: z.optional(WhereDtoSchema)
})

export const PasswordDtoSchema = z.object({
    id: roomIdSchema,
    password: z.string()
})
