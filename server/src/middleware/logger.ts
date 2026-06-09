/**
 * 请求日志中间件
 * 记录每个 API 请求的方法、路径、状态码、耗时
 */
import { Request, Response, NextFunction } from 'express';

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? '⚠' : res.statusCode >= 500 ? '🔴' : '→';
    console.log(
      `${timestamp()} ${level} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });

  next();
}

/** 全局错误处理 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(`${timestamp()} 🔴 ERROR: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
}
