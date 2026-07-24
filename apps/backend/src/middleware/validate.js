import { z } from "zod";

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError || error.name === 'ZodError') {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors || error.issues,
      });
    }
    next(error);
  }
};
