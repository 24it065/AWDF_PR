/**
 * requestLogger middleware
 * Logs [METHOD] [PATH] [TIMESTAMP] for every incoming request.
 */
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${req.method}] ${req.originalUrl} ${timestamp}`);
  next();
};

module.exports = requestLogger;
