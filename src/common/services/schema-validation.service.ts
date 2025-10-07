import { Injectable } from '@nestjs/common';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

@Injectable()
export class SchemaValidationService {
    private ajv = new Ajv({ allErrors: true });
    private validators = new Map<string, any>();

    constructor() {
        addFormats(this.ajv);
    }

    private getValidator(schemaKey: string, schema: object): any {
        let validate = this.validators.get(schemaKey);
        if (!validate) {
            validate = this.ajv.compile(schema);
            this.validators.set(schemaKey, validate);
        }
        return validate;
    }

    validate(
        schemaKey: string,
        schema: object,
        data: any,
    ): { valid: boolean; errors?: string } {
        const validate = this.getValidator(schemaKey, schema);
        const valid = validate(data);

        if (!valid) {
            const errors = validate.errors
                ?.map((e) => `${e.instancePath || '(root)'} ${e.message}`)
                .join(', ');
            return { valid: false, errors };
        }

        return { valid: true };
    }
}
