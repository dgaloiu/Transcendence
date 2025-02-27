import {
	Module,
} from "@nestjs/common";

import { PrismaService } from 'prisma/prisma.service';
import { ChatService } from "src/chat/chat.service";

@Module({
	providers: [
		PrismaService,
		ChatService,
	],
})
export class ChatModule {}
