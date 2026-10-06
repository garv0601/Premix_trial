export const errorHandler = (err, req, res, next) => {
  // Full detail stays in the server logs for diagnosis.
  console.error('API Error Stack:', err.stack || err.message);

  const status = err.status || 500;
  const isProduction = (process.env.NODE_ENV || 'development') === 'production';

  // In production, never leak internal error text for unexpected (5xx) errors.
  // Deliberate 4xx errors (validation etc.) keep their user-facing message.
  const message = (isProduction && status >= 500)
    ? 'Internal Server Error'
    : (err.message || 'Internal Server Error');

  res.status(status).json({
    success: false,
    message,
  });
};
