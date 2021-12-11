import { env } from 'process';

export const LOG_LEVELS = {
  ERROR: 3,
  WARN: 2,
  INFO: 1,
};

const LOG_LEVEL = LOG_LEVELS[env.LOG_LEVEL] || LOG_LEVELS.INFO;

export default class Logger {
  static error(...params) {
    if (LOG_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(...params);
    }
  }

  static log(...params) {
    if (LOG_LEVEL <= LOG_LEVELS.INFO) {
      console.log(...params);
    }
  }

  static warn(...params) {
    if (LOG_LEVEL <= LOG_LEVELS.INFO) {
      console.warn(...params);
    }
  }
}
