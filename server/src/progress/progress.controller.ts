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
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AddProgressDto } from './dto/add-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.progressService.findAllByUser(req.user.id);
  }

  @Get(':songId')
  findOne(@Request() req: any, @Param('songId', ParseIntPipe) songId: number) {
    return this.progressService.findOne(req.user.id, songId);
  }

  @Post()
  async addToProgress(@Request() req: any, @Body() dto: AddProgressDto) {
    return this.progressService.addToProgress(
      req.user.id,
      dto.songId,
      dto.status || 'want_to_learn',
    );
  }

  @Put(':songId')
  async updateProgress(
    @Request() req: any,
    @Param('songId', ParseIntPipe) songId: number,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.progressService.updateProgress(
      req.user.id,
      songId,
      dto.status,
      dto.position,
    );
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
