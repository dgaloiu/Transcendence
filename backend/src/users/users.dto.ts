import { PartialType } from '@nestjs/mapped-types';

export class CreateUserDto
{
	id:					string
	email:				string
	intraLogin:			string
	name:				string
	doubleAuth?:		boolean
	doubleAuthSecret?:	string
	avatar?:			string
	gameWon?:			number;
	gameLost?:			number;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}


