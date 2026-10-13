export function logInfo(message: string, meta?: Record<string, unknown>) {
  console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() }));
}

export function logError(message: string, error: unknown, meta?: Record<string, unknown>) {
  const errorMeta = error instanceof Error 
    ? { name: error.name, message: error.message, stack: error.stack }
    : { error: String(error) };
  console.error(JSON.stringify({ level: 'error', message, ...errorMeta, ...meta, timestamp: new Date().toISOString() }));
}

export function logWarn(message: string, meta?: Record<string, unknown>) {
  console.warn(JSON.stringify({ level: 'warn', message, ...meta, timestamp: new Date().toISOString() }));
}