import {
  Controller,
  Get,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { LogsService, LogLevel } from './logs.service';
import { JwtAuthGuard, AdminGuard } from '../auth/auth.guard';

@Controller('logs')
@UseGuards(JwtAuthGuard, AdminGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  async findAll(
    @Query('level') level?: LogLevel,
    @Query('action') action?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.logsService.findAll({
      level,
      action,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Delete('clear')
  async clearOldLogs(@Query('days') days?: string) {
    const daysToKeep = days ? parseInt(days, 10) : 30;
    const deleted = await this.logsService.clearOldLogs(daysToKeep);
    return { deleted, message: `Deleted ${deleted} logs older than ${daysToKeep} days` };
  }
}
