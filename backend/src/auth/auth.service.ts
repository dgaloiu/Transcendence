//	nestjs/common
import {
	Injectable,
	BadRequestException,
	UnauthorizedException,
	Logger, //debugging purpose
} from '@nestjs/common';
import type { Response } from 'express';

import { AuthUser, JwtPayload } from 'src/shared/auth.interfaces';

import { User } from "src/users/user.entity";
import { UsersService } from 'src/users/users.service';

//JWT passport
import { JwtService } from '@nestjs/jwt';

import { authenticator } from 'otplib';
import { toFileStream } from 'qrcode';

@Injectable()
export class AuthService {
	constructor(
		private jwtService: JwtService,
		private usersService: UsersService,
	) {
	}

	async login(intraUserInfo: any)
	{
		const user = {
			email: intraUserInfo.email,
			intraLogin: intraUserInfo.login,
			name: intraUserInfo.usual_full_name,
		}
		const userFound = await this.usersService.findOrCreateUser(user);
		if (userFound.isConnected)
			return (undefined);
		const result = {
			id: userFound.id,
			name: userFound.name,
			doubleAuth: userFound.doubleAuth,
			token: undefined,
		};
		if (result.doubleAuth == false)
			result.token = await this.Jwt_GetTokens({
				id: userFound.id,
				name: userFound.name,
				doubleAuth: userFound.doubleAuth,
			});
		return (result);
	}

	async logout(userId:string) {
		const data = {
			isConnected: false,
			isTalking: false,
			isPlaying: false,
		};
		await this.usersService.update(userId, data);
	}

	//	JWT
	async Jwt_GetTokens(payload: JwtPayload) {
		const payloadSend = {
			id: payload.id,
			name: payload.name,
			doubleAuth: payload.doubleAuth,
		}
		const access_conf = {
			secret: process.env.JWT_ACCESS_SECRET,
			expiresIn: '15m',
		};
		const refresh_conf = {
			secret: process.env.JWT_REFRESH_SECRET,
			expiresIn: '7d',
		};
		const [access, refresh] = await Promise.all([
			this.jwtService.signAsync(payloadSend, access_conf),
			this.jwtService.signAsync(payloadSend, refresh_conf),
		]);
		return { access, refresh };
	}
}

@Injectable()
export class TwoFactorService {
	constructor(
		private authService: AuthService,
		private usersService: UsersService,
	) { }

	private async IsValid(userId:string, code:string) {
		const found = await this.usersService.find({ id: userId });
		const isOk = authenticator.check(code, found.doubleAuthSecret);
		if (isOk == false)
			throw new UnauthorizedException('Wrong authentication code');
	}

	async TurnOn(userId: string, code: string) {
		await this.IsValid(userId, code);
		await this.usersService.update(userId, { doubleAuth: true });
	}

	async TurnOff(userId: string, code: string) {
		await this.IsValid(userId, code);
		await this.usersService.update(userId, { doubleAuth: false });
	}

	async Authenticate(user:any, code:string) {
		await this.IsValid(user.id, code);
		const token = await this.authService.Jwt_GetTokens(user);
		return (token);
	}

	async GenerateQrCode(stream: Response, user: AuthUser) {
		const found = await this.usersService.find({ id: user.id });
		var doubleAuthSecret = found?.doubleAuthSecret;
		if (found && found.doubleAuth === false) {
			doubleAuthSecret = authenticator.generateSecret();
			await this.usersService.update(user.id, { doubleAuthSecret });
		}
		const otpAuthUrl = authenticator.keyuri(
			user.intraLogin,
			process.env.APP_NAME,
			doubleAuthSecret);
		return (toFileStream(stream, otpAuthUrl));
	}

}
