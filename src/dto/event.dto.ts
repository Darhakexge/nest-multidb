import { IsObject, IsString } from 'class-validator';
import { schemas } from '../schemas';
import { ValidateWithSchema } from '../validators/validate-with-schema.decorator';

export class EventDto {
    @IsString()
    type: string;

    @IsObject()
    @ValidateWithSchema((ctx) => ({
        key: ctx.object['type'],
        schema: schemas[ctx.object['type']],
    }))
    data: any;
}
