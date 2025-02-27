import { z } from 'zod'
import {
	JoinDtoSchema,
	MessageDtoSchema,
	RoomTypeSchema,
	WhereDtoSchema,
	WhoDtoSchema,
	CreateRoomDtoSchema,
	chatInteractionDtoSchema,
	RoomDtoSchema,
	PasswordDtoSchema,
	roomSettingsDtoSchema,
} from './schemas/chat.schemas'

export type WhoDto = z.infer< typeof WhoDtoSchema >;

export type WhereDto = z.infer< typeof WhereDtoSchema >;

export type MessageDto = z.infer< typeof MessageDtoSchema >;

export type JoinDto = z.infer< typeof JoinDtoSchema >;

export type RoomType = z.infer< typeof RoomTypeSchema >;

export type RoomDto = z.infer< typeof RoomDtoSchema >;

export type CreateRoomDto = z.infer< typeof CreateRoomDtoSchema >;

export type chatInteractionDto = z.infer< typeof chatInteractionDtoSchema >;

export type PasswordDto = z.infer< typeof PasswordDtoSchema >;

export type roomSettingsDto = z.infer<typeof roomSettingsDtoSchema>;