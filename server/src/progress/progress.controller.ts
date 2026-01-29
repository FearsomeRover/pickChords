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

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
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
  ) {
    const progress = await this.progressService.addToProgress(
      req.user.id,
      body.songId,
      body.status || 'want_to_learn',
    );

    return progress;
  }

  @Put(':songId')
  async updateProgress(
    @Request() req: any,
    @Param('songId', ParseIntPipe) songId: number,
    @Body() body: { status: ProgressStatus; position: number },
  ) {
    const progress = await this.progressService.updateProgress(
      req.user.id,
      songId,
      body.status,
      body.position,
    );

    return progress;
  }

  @Delete(':songId')
  async removeFromProgress(
    @Request() req: any,
    @Param('songId', ParseIntPipe) songId: number,
  ) {
    await this.progressService.removeFromProgress(req.user.id, songId);

    return { message: 'Removed from progress' };
  }
}
