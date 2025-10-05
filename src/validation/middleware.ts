import { Request, Response, NextFunction } from "express";
import * as Joi from "joi";
import { ResponseWrapper } from "./ResponseWrapper";

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      return res
        .status(400)
        .json(ResponseWrapper.error("Validation failed", errorMessage));
    }

    req.body = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, { abortEarly: false });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      return res
        .status(400)
        .json(ResponseWrapper.error("Invalid parameters", errorMessage));
    }

    req.params = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      return res
        .status(400)
        .json(ResponseWrapper.error("Invalid query parameters", errorMessage));
    }

    req.query = value;
    next();
  };
};
