//	nestjs/common
import {
	Module
} from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';
import { AccessTokenStrategy } from './strategies/accessToken'
import { RefreshTokenStrategy } from './strategies/refreshToken';
import { WebsocketAccessTokenStrategy } from './guards/websocket'

import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';


import { AuthService, TwoFactorService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
	imports: [
		UsersModule,
		JwtModule.register({})
	],
	providers: [
		AuthService, TwoFactorService,
		UsersService,
		AccessTokenStrategy,
		RefreshTokenStrategy,
		WebsocketAccessTokenStrategy,
	],
	controllers: [
		AuthController
	]
})
export class AuthModule {}
