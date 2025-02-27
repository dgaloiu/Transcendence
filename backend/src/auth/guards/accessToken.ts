//	nestjs/common
import {
	Injectable,
	ExecutionContext,
	Logger,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AccessTokenGuard extends AuthGuard('jwt')
{
	getRequest(context: ExecutionContext): Request
	{
		const request = context.switchToHttp().getRequest();
		return (request);
	}
}

