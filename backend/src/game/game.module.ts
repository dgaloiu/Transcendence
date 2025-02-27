import { GameGateway } from "./game.gateway";
import { GameService } from "./game.service";
import { Module } from "@nestjs/common";

@Module({
	imports:[
		GameService,
		GameGateway
	]
})
export class GameModule {}
