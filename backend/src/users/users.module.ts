import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { PrismaService } from 'prisma/prisma.service';

@Module({
	imports: [
		PrismaModule
	],
	providers: [
		UsersService,
		PrismaService,
	],
	exports: [
		PrismaService,
	],
	controllers: [
		UsersController
	]

})
export class UsersModule {}
