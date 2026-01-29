import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Headers,
} from '@nestjs/common';
import { ProgressService, ProgressStatus } from './progress.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { LogsService } from '../logs/logs.service';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
    private readonly logsService: LogsService,
  ) {}

  @Get()
  findAll(@Request() req: any) {
    return this.progressService.findAllByUser(req.user.id);
  }

  @Get(':songId')
  findOne(@Request() req: any, @Param('songId', ParseIntPipe) songId: number) {
    return this.progressService.findOne(req.user.id, songId);
  }

  @Post()
  async addToProgress(
    @Request() req: any,
    @Body() body: { songId: number; status?: ProgressStatus },
    @Headers('user-agent') userAgent?: string,
  ) {
    const progress = await this.progressService.addToProgress(
      req.user.id,
      body.songId,
      body.status || 'want_to_learn',
    );

    await this.logsService.info('progress.add', `Song added to progress board`, {
      userId: req.user.id,
      username: req.user.username,
      ipAddress: req.ip,
      userAgent,
      metadata: { songId: body.songId, status: body.status || 'want_to_learn' },
    });

    return progress;
  }

  @Put(':songId')
  async updateProgress(
    @Request() req: any,
    @Param('songId', ParseIntPipe) songId: number,
    @Body() body: { status: ProgressStatus; position: number },
    @Headers('user-agent') userAgent?: string,
  ) {
    const progress = await this.progressService.updateProgress(
      req.user.id,
      songId,
      body.status,
      body.position,
    );

    await this.logsService.info('progress.update', `Song progress updated`, {
      userId: req.user.id,
      username: req.user.username,
      ipAddress: req.ip,
      userAgent,
      metadata: { songId, status: body.status, position: body.position },
    });

    return progress;
  }

  @Delete(':songId')
  async removeFromProgress(
    @Request() req: any,
    @Param('songId', ParseIntPipe) songId: number,
    @Headers('user-agent') userAgent?: string,
  ) {
    await this.progressService.removeFromProgress(req.user.id, songId);

    await this.logsService.info('progress.remove', `Song removed from progress board`, {
      userId: req.user.id,
      username: req.user.username,
      ipAddress: req.ip,
      userAgent,
      metadata: { songId },
    });

    return { message: 'Removed from progress' };
  }
}
