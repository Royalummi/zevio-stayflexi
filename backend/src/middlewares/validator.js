import { validationResult } from "express-validator";
import { sendError } from "../utils/response.js";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return sendError(res, "Validation failed", 400, formattedErrors);
  }

  next();
};
