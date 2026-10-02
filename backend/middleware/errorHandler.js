// Global Error Handling Middleware
export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url} - `, err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler;
