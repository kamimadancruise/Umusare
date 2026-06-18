function validateRequest(schema) {
  return function validationMiddleware(req, res, next) {
    if (!schema) {
      return next();
    }

    const errors = schema(req.body, req);
    if (errors && errors.length) {
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.errors = errors;
      return next(error);
    }

    return next();
  };
}

module.exports = validateRequest;
