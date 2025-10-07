import { registerDecorator, ValidationOptions } from 'class-validator';
import {
    SchemaResolver,
    SchemaValidatorConstraint,
} from './schema-validator.constraint';

export function ValidateWithSchema(
    schemaOrResolver: SchemaResolver,
    validationOptions?: ValidationOptions,
) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'ValidateWithSchema',
            target: object.constructor,
            propertyName,
            constraints: [schemaOrResolver],
            options: validationOptions,
            validator: SchemaValidatorConstraint,
        });
    };
}
