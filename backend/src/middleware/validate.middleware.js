import { ApiError } from '../utils/ApiError.js';
import { ZodError } from 'zod';

export const validate = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        return next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessages = error.errors.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));
            return next(new ApiError(400, "Validation Failed", errorMessages));
        }
        return next(error);
    }
};
