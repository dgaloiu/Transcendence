//	nestjs/common
import {
	Injectable,
	CanActivate,
	ExecutionContext,
	InternalServerErrorException,
	Logger,
} from "@nestjs/common"

import { UsersService } from "src/users/users.service";
import { User } from '@prisma/client'

type IntraUserInfo = {
	signedIn: boolean,
	intraLogin: string,
	//user: /*User*/ Boolean | null,
	user: User,
	token?: string,
}

@Injectable()
export class Intra42AuthGuard implements CanActivate {
	constructor() { }

	private async get42ApiToken(client_code: string) {
		const requestQuery = {
			grant_type: 'authorization_code',
			client_id: process.env.API_42_UID,
			client_secret: process.env.API_42_SECRET,
			redirect_uri: process.env.API_42_REDIRECT,
			code: client_code,
		};
		const requestOptions = {
			method: 'POST',
			header: {
				'Accept-Encoding': 'application/json'
			}
		};

		const url = 'https://api.intra.42.fr/v2/oauth/token?' + new URLSearchParams(requestQuery);
		try {
			const response = await fetch(url, requestOptions);
			const data = await response.json();
			return {
				status: response.status,
				...data,
			};
		} catch (e) {
			Logger.debug(e, 'get42ApiToken');
		}

	}

	async getIntraUserInfo(accessToken: string): Promise<IntraUserInfo> {
		const requestOptions = {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`
			}
		};
		const url = 'https://api.intra.42.fr/v2/me/';
		try {
			const response = await fetch(url, requestOptions);
			if (response.ok === false)
				return (undefined);
			const data = await response.json();
			return {
				status: response.status,
				...data,
			};
		} catch (e) {
			Logger.debug(e, 'getIntraUserInfo');
		}
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const code = context.getArgByIndex(0).query.code;
		const request = context.switchToHttp().getRequest();

		try {
			const token = await this.get42ApiToken(code);
			if (token === undefined)
				return (false); ''
			request.intraUserInfo = await this.getIntraUserInfo(token['access_token']);
			if (request.intraUserInfo === undefined)
				return (false);
			return true
		} catch (e) {
			throw new InternalServerErrorException('Unable to get ressources from 42 api, try again')
		}

	}
}
