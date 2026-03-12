// Simple structured logging utility
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: string;
  ip?: string;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      data,
    };

    return JSON.stringify(logEntry);
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage("debug", message, data));
    }
  }

  info(message: string, data?: any) {
    console.info(this.formatMessage("info", message, data));
  }

  warn(message: string, data?: any) {
    console.warn(this.formatMessage("warn", message, data));
  }

  error(message: string, error?: Error | any, data?: any) {
    const errorData = {
      ...data,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    };

    console.error(this.formatMessage("error", message, errorData));
  }

  // Security-specific logging
  security(message: string, data?: any) {
    this.warn(`SECURITY: ${message}`, {
      ...data,
      category: "security",
    });
  }

  // API-specific logging
  api(
    method: string,
    path: string,
    statusCode: number,
    duration?: number,
    userId?: string,
  ) {
    this.info(`API ${method} ${path}`, {
      method,
      path,
      statusCode,
      duration,
      userId,
      category: "api",
    });
  }
}

export const logger = new Logger();
