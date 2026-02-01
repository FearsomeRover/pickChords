import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  private toLogEntry(dbLog: any): LogEntry {
    return {
      id: dbLog.id,
      level: dbLog.level as LogLevel,
      action: dbLog.action,
      message: dbLog.message,
      user_id: dbLog.userId,
      username: dbLog.username,
      ip_address: dbLog.ipAddress,
      user_agent: dbLog.userAgent,
      metadata: dbLog.metadata as Record<string, any> | null,
      created_at: dbLog.createdAt.toISOString(),
    };
  }

  async log(
    level: LogLevel,
    action: string,
    message: string,
    context?: LogContext,
  ): Promise<void> {
    try {
      await this.prisma.log.create({
        data: {
          level,
          action,
          message,
          userId: context?.userId || null,
          username: context?.username || null,
          ipAddress: context?.ipAddress || null,
          userAgent: context?.userAgent || null,
          metadata: context?.metadata || undefined,
        },
      });
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
    const where: any = {};

    if (options?.level) {
      where.level = options.level;
    }

    if (options?.action) {
      where.action = { contains: options.action, mode: 'insensitive' };
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [logs, total] = await Promise.all([
      this.prisma.log.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.log.count({ where }),
    ]);

    return {
      logs: logs.map(this.toLogEntry),
      total,
    };
  }

  async clearOldLogs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.log.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}
