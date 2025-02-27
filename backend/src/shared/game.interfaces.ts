import { z } from 'zod'
import { BallSchema, 
    endGameDtoSchema, 
    gameBallDtoSchema, 
    gameDtoSchema, 
    gameIdSchema, 
    gamePaddleDtoSchema, 
    gameSettingsDtoSchema, 
    newGameDtoSchema, 
    inviteGameDtoSchema,
    sideDtoSchema } from './schemas/game.schemas'

export type gameId = z.infer< typeof gameIdSchema >;

export type Ball = z.infer< typeof BallSchema >;

export type gameBallDto = z.infer< typeof gameBallDtoSchema >;

export type gamePaddleDto = z.infer< typeof gamePaddleDtoSchema >;

export type sideDto = z.infer< typeof sideDtoSchema >;

export type gameDto = z.infer< typeof gameDtoSchema >;

export type endGameDto = z.infer< typeof endGameDtoSchema >;

export type newGameDto = z.infer< typeof newGameDtoSchema >;

export type inviteGameDto = z.infer< typeof inviteGameDtoSchema >;

export type gameSettingsDto = z.infer< typeof gameSettingsDtoSchema >;