import {
	PipeTransform,
	ArgumentMetadata,
	BadRequestException,

	Logger,
} from '@nestjs/common';
import { Schema  } from 'zod';

export class ZodValidationPipe implements PipeTransform
{
	constructor(private schema: Schema) {}

	transform(value: unknown, metadata: ArgumentMetadata) {
		try {
			if (metadata.type == "body"){
			const parsedValue = this.schema.parse(value);
			return parsedValue;
			}
		} catch (error) {
			Logger.debug(value, typeof (value), error, 'ValidationPipe');
			throw new BadRequestException('Validation failed');
		}
	}
}
