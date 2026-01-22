/**
 * PageNodes Logger - Centralized logging with MCP access
 *
 * Usage (internal pagenodes code):
 *   import { logger } from '../utils/logger';
 *   logger.log('message', data);
 *   logger.warn('warning message');
 *   logger.error('error message', error);
 *
 * The logger automatically knows its context (ui, worker, audio, etc.)
 * based on how it was created.
 */

class PNLogger {
  constructor(context, maxLogs = 1000) {
    this.context = context;
    this.logs = [];
    this.maxLogs = maxLogs;
  }

  _formatArg(arg) {
    if (arg === undefined) return 'undefined';
    if (arg === null) return 'null';
    if (arg instanceof Error) {
      return `${arg.name}: ${arg.message}`;
    }
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }

  _addEntry(level, args) {
    const entry = {
      t: Date.now(),
      c: this.context,
      l: level,
      m: args.map(a => this._formatArg(a)).join(' ')
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    return entry;
  }

  log(...args) {
    this._addEntry('log', args);
    console.log(`[${this.context}]`, ...args);
  }

  warn(...args) {
    this._addEntry('warn', args);
    console.warn(`[${this.context}]`, ...args);
  }

  error(...args) {
    this._addEntry('error', args);
    console.error(`[${this.context}]`, ...args);
  }

  /**
   * Get recent logs
   * @param {number} limit - Max number of logs to return
   * @param {string} context - Optional context filter
   * @param {string} level - Optional level filter ('log', 'warn', 'error')
   * @returns {Array} Log entries (newest last)
   */
  getLogs(limit = 100, context = null, level = null) {
    let result = this.logs;
    if (context) {
      result = result.filter(l => l.c === context);
    }
    if (level) {
      result = result.filter(l => l.l === level);
    }
    return result.slice(-limit);
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
  }

  /**
   * Merge logs from another source (e.g., worker)
   * @param {Array} entries - Log entries to merge
   */
  merge(entries) {
    if (!Array.isArray(entries)) return;
    for (const entry of entries) {
      if (entry && entry.t && entry.c && entry.m) {
        this.logs.push(entry);
      }
    }
    // Sort by timestamp and trim
    this.logs.sort((a, b) => a.t - b.t);
    while (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }
}

// Singleton instance for main thread (UI context)
export const logger = new PNLogger('ui');

// Factory for creating context-specific loggers on main thread
export function createLogger(context) {
  return new PNLogger(context);
}

/**
 * Create a PN object for main thread node handlers.
 * This is passed to mainThread methods in node definitions.
 * @returns {object} PN object with log, warn, error methods
 */
export function createMainThreadPN() {
  return {
    log(...args) {
      logger.log(...args);
    },
    warn(...args) {
      logger.warn(...args);
    },
    error(...args) {
      logger.error(...args);
    }
  };
}

// Factory for creating worker-side logger that syncs to main thread
export function createWorkerLogger(context, notifyFn) {
  const loggerInstance = new PNLogger(context);
  const batchSize = 50;
  let pending = [];
  let flushTimer = null;

  function flush() {
    if (pending.length > 0) {
      notifyFn(pending);
      pending = [];
    }
    flushTimer = null;
  }

  function scheduleFlush() {
    if (!flushTimer) {
      flushTimer = setTimeout(flush, 100);
    }
  }

  return {
    log(...args) {
      const entry = loggerInstance._addEntry('log', args);
      console.log(`[${context}]`, ...args);
      pending.push(entry);
      if (pending.length >= batchSize) {
        flush();
      } else {
        scheduleFlush();
      }
    },

    warn(...args) {
      const entry = loggerInstance._addEntry('warn', args);
      console.warn(`[${context}]`, ...args);
      pending.push(entry);
      scheduleFlush();
    },

    error(...args) {
      const entry = loggerInstance._addEntry('error', args);
      console.error(`[${context}]`, ...args);
      pending.push(entry);
      flush(); // Flush errors immediately
    },

    // For local access in worker
    getLogs: loggerInstance.getLogs.bind(loggerInstance),
    clear: loggerInstance.clear.bind(loggerInstance),
    flush
  };
}
