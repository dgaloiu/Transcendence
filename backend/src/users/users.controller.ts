import {
	Controller,
	UseGuards,
	Get,
	Post,
	Request,
	Res,
	Body,
//	Response,
	UseInterceptors,
	UploadedFile,
	StreamableFile,
	Logger,
} from "@nestjs/common";

import { createReadStream } from 'fs';

import {
	FileInterceptor,
} from '@nestjs/platform-express'
import { diskStorage } from  'multer';
import { Express } from 'express'

import { AccessTokenGuard } from '../auth/guards/accessToken';
import { PrismaService } from 'prisma/prisma.service';

import { writeFile, rm } from 'fs';
import { randomUUID } from 'crypto';

import { UsersService } from "./users.service";

import type { Response } from 'express';

@Controller('users')
export class UsersController
{
	constructor(
		private prisma: PrismaService,
		private chat: UsersService,
	){}

	@Post('upload')
	@UseGuards(AccessTokenGuard)
	@UseInterceptors(FileInterceptor(
		'file', {
			storage: diskStorage({ destination: './src/upload' })
		})
	)
	async uploadImage(@Request() request, @UploadedFile() file) {
		try {
			const user = await this.prisma.user.findUniqueOrThrow({ where: { id: request.user.id } })
			if (user === undefined)
				return (false);
			await this.prisma.user.update({
				where: { id: request.user.id },
				data: { avatar: file.path }
			});
			const fileStream = createReadStream(file.path);
			if (user.avatar)
				rm(user.avatar, (err) => {});
		} catch (e) {
			Logger.debug(e, "file couldn't be saved");
		}
	}

	@UseGuards(AccessTokenGuard)
	@Post('avatar')
	async getFile(
		@Request() request,
		@Res({ passthrough: true }) res: Response
	): Promise<StreamableFile> {
		try {
			const where = { id: request.body.id };
			const found = await this.prisma.user.findUnique({ where });
			if (found && found.avatar) {
				const file = createReadStream(found.avatar);
				res.status(201);
				return new StreamableFile(file);
			}
			res.status(202);
			return (undefined);
		} catch (e) {
			Logger.debug(e, 'getFile');
		}
	}

	@UseGuards(AccessTokenGuard)
	@Get('leaderBoard')
	async leaderBoard(@Request() request) {
		return (await this.chat.leaderBoard());
	}

	@UseGuards(AccessTokenGuard)
	@Post('history')
	async history(
		@Request() request,
		@Body() body,
	) {
		const userId = body.id;
		return (await this.chat.history(userId));
	}

}
