//	nestjs/common
import {
	Controller,
	UseGuards,
	Query,
	Body,
	Request,
//	Response,
	Res,
	Post,
	Get,
	HttpCode,
	Logger, //debugging purpose
} from '@nestjs/common';
import type { Response } from 'express';

import { AuthService, TwoFactorService } from 'src/auth/auth.service'
import { UsersService } from 'src/users/users.service';
import { Intra42AuthGuard } from './guards/intra42';
import { AccessTokenGuard } from './guards/accessToken';
import { RefreshTokenGuard } from './guards/refreshToken';

import { JwtPayload } from 'src/shared/auth.interfaces';

@Controller('auth')
export class AuthController {
	constructor(
		private authService: AuthService,
		private twoFactorService: TwoFactorService,
		private usersService: UsersService,
	) {
	}

	@Get('/login')
	@UseGuards(Intra42AuthGuard)
	async login(
		@Request() request: any,
		@Res({ passthrough: true }) res: Response
	) {
		const result = await this.authService.login(request.intraUserInfo);
		if (result === undefined) {
			res.status(202);
			return (undefined);
		}
		res.status(201);
		return (result);
	}

	@Get('/logout')
	async logout(
		@Request() request: any,
		@Res({ passthrough: true }) res: Response
	) {
		const user = request.user;
		if (user)
			await this.authService.logout(user.id);
	}


	@Get('refresh')
	@UseGuards(RefreshTokenGuard)
	refreshToken(
		@Request() request: any,
		@Res({ passthrough: true }) response: Response
	) {
		const payload = request.user;
		return (this.authService.Jwt_GetTokens(payload));
	}

	//	2FA
	@Post('2fa/register')
	@UseGuards(AccessTokenGuard)
	async register(
		@Request() request,
		@Res() response: Response
	) {
		const user = request.user;
		const qrCode = await this.twoFactorService.GenerateQrCode(response, user);
		return (qrCode);
	}

	@Post('2fa/turn-on')
	@UseGuards(AccessTokenGuard)
	async TwoFactor_TurnOn(
		@Request() request,
		@Body() body,
	) {
		const code = body._2fa_code;
		const user = request.user;
		await this.twoFactorService.TurnOn(user.id, code);
	}

	@Post('2fa/turn-off')
	@UseGuards(AccessTokenGuard)
	async TwoFactor_TurnOff(
		@Request() request,
		@Body() body,
	) {
		const code = body._2fa_code;
		const user = request.user;
		await this.twoFactorService.TurnOff(user.id, code);
	}

	@Post('2fa/authenticate')
	@HttpCode(200)
	async authenticate(@Body() { user, _2fa_code }) {
		const result = await this.twoFactorService.Authenticate(user, _2fa_code);
		return (result);
	}

}

