import { Module } from '@nestjs/common';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';

import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';

import { ChatModule } from './chat/chat.module';
import { ChatService } from './chat/chat.service';
import { ChatGateway } from './chat/chat.gateway';

import { ConnectedGateway } from "src/users/users.gateway";

import { GameService } from "./game/game.service";
import { GameGateway } from "./game/game.gateway";

import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from './pipes/validation.pipe'

@Module({
	imports: [
		AuthModule,
		UsersModule,
		ChatModule,
	],
	providers:[
		UsersService,
		ChatService, ChatGateway,
		GameService, GameGateway,
		ConnectedGateway,
		AppService,
		ZodValidationPipe
	],
})
export class AppModule {}
