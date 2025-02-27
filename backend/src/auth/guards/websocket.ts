import {
	ExecutionContext,
	Request,
	Injectable,
	Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthGuard } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class WebsocketAccessTokenStrategy extends PassportStrategy(Strategy, 'jwt-websocket')
{
	constructor()
	{
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: process.env.JWT_ACCESS_SECRET,
			ignoreExpiration: false,
		});
	}

	validate(payload: any) {
		return payload;
	}
}

@Injectable()
export class WebSocketAccessTokenGuard extends AuthGuard('jwt-websocket')
{
	getRequest(context: ExecutionContext): Request
	{
		const ws = context.switchToWs();
		const data = context.switchToWs().getData();
		const request = context.switchToHttp().getRequest();
		request.headers = {
			authorization: `Bearer ${data.token}`
		};
		return (request);
	}

	async canActivate(context: ExecutionContext): Promise<any> {
		const data = context.switchToWs().getData();
		try {
			var ok = super.canActivate(context);
			if (ok instanceof Observable)
				ok = ok.toPromise();
			if (ok instanceof Promise)
				ok = await ok;
		} catch (e) {
			return (false);
		}
		return (true);
	}
}
