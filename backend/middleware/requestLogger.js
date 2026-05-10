import { randomUUID } from 'crypto';

export function requestLogger(req, res, next) {
  const reqId = randomUUID();
  req.reqId = reqId;
  const start = Date.now();
  const path = req.originalUrl || req.url;
  res.on('finish', () => {
    const line = JSON.stringify({
      level: 'info',
      reqId,
      method: req.method,
      path,
      status: res.statusCode,
      ms: Date.now() - start,
      user: req.user?.email || null,
    });
    console.log(line);
  });
  next();
}
