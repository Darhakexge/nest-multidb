import userSchema from './user.schema.json';
import orderSchema from './order.schema.json';
import auditSchema from './audit.schema.json';

export const schemas = {
    'create-user': userSchema,
    'create-order': orderSchema,
    'audit-log': auditSchema,
};
