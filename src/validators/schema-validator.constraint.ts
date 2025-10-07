import { Injectable } from '@nestjs/common';
import {
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { SchemaValidationService } from '../common/services/schema-validation.service';

export type SchemaResolver =
    | object
    | ((ctx: ValidationArguments) => { key: string; schema: object });

@Injectable()
@ValidatorConstraint({ name: 'SchemaValidator', async: false })
export class SchemaValidatorConstraint implements ValidatorConstraintInterface {
    constructor(
        private readonly schemaValidationService: SchemaValidationService,
    ) {}

    validate(value: any, args: ValidationArguments): boolean {
        const [schemaOrResolver] = args.constraints;
        const schemaData =
            typeof schemaOrResolver === 'function'
                ? schemaOrResolver(args)
                : { key: args.property, schema: schemaOrResolver };

        const { valid } = this.schemaValidationService.validate(
            schemaData.key,
            schemaData.schema,
            value,
        );
        return valid;
    }

    defaultMessage(args: ValidationArguments): string {
        const [schemaOrResolver] = args.constraints;
        const schemaData =
            typeof schemaOrResolver === 'function'
                ? schemaOrResolver(args)
                : { key: args.property, schema: schemaOrResolver };

        const result = this.schemaValidationService.validate(
            schemaData.key,
            schemaData.schema,
            args.value,
        );

        return `Schema validation failed: ${result.errors}`;
    }
}
