import * as socketIo from 'socket.io'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
//import { Server } from 'socket.io';

import * as bodyParser from 'body-parser';
async function bootstrap()
{
	const app = await NestFactory.create(AppModule);
	app.enableCors();
	app.use(bodyParser.json({ limit: '50mb' }));
	app.use(bodyParser.urlencoded({
		limit: '50mb',
		extended: true,
		parameterLimit: 50000
	}));
/*
	const server = app.getHttpServer();
	const io = new Server(server, {
		connectionStateRecovery: {}});
	io.engine.use((req, res, next) => {
		session(req);
		});
*/

	await app.listen(4000);
}
bootstrap();
