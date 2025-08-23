// backend/validate.js  (ESM)
import { z } from 'zod';

export function makeValidator(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
    }
    req.validated = parsed.data;
    next();
  };
}

export { z };
