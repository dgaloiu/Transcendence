import { z } from 'zod'
import { AuthUserSchema, JwtPayloadSchema } from './schemas/auth.schemas'

export type AuthUser = z.infer< typeof AuthUserSchema >;

export type JwtPayload = z.infer<typeof JwtPayloadSchema >;
