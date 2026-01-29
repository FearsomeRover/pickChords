import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  id: number;
  level: LogLevel;
  action: string;
  message: string;
  user_id: number | null;
  username: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface LogContext {
  userId?: number;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class LogsService {
  constructor(private readonly db: DatabaseService) {}

  async log(
    level: LogLevel,
    action: string,
    message: string,
    context?: LogContext,
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO logs (level, action, message, user_id, username, ip_address, user_agent, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          level,
          action,
          message,
          context?.userId || null,
          context?.username || null,
          context?.ipAddress || null,
          context?.userAgent || null,
          context?.metadata ? JSON.stringify(context.metadata) : null,
        ],
      );
    } catch (error) {
      // Don't let logging errors crash the app
      console.error('Failed to write log:', error);
    }
  }

  async info(action: string, message: string, context?: LogContext): Promise<void> {
    await this.log('info', action, message, context);
  }

  async warn(action: string, message: string, context?: LogContext): Promise<void> {
    await this.log('warn', action, message, context);
  }

  async error(action: string, message: string, context?: LogContext): Promise<void> {
    await this.log('error', action, message, context);
  }

  async findAll(options?: {
    level?: LogLevel;
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: LogEntry[]; total: number }> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (options?.level) {
      conditions.push(`level = $${paramIndex++}`);
      params.push(options.level);
    }

    if (options?.action) {
      conditions.push(`action ILIKE $${paramIndex++}`);
      params.push(`%${options.action}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await this.db.query(
      `SELECT COUNT(*) FROM logs ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count);

    // Get logs with pagination
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const result = await this.db.query(
      `SELECT * FROM logs ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset],
    );

    return {
      logs: result.rows,
      total,
    };
  }

  async clearOldLogs(daysToKeep: number = 30): Promise<number> {
    const result = await this.db.query(
      `DELETE FROM logs WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'`,
    );
    return result.rowCount || 0;
  }
}
