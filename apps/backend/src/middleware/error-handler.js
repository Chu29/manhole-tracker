/**
 * Centralized error handler. Keep this as the LAST app.use() in index.js.
 */
export function errorHandler(err, req, res, _next) {
  console.error(err);

  // Postgres unique_violation (e.g. duplicate email or manhole code)
  if (err.code === "23505") {
    return res
      .status(409)
      .json({ error: "Resource already exists", detail: err.detail });
  }

  // Postgres check_violation (e.g. bad utility_type)
  if (err.code === "23514") {
    return res
      .status(400)
      .json({ error: "Invalid field value", detail: err.detail });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
