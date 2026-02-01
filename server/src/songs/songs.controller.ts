import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
  Headers,
} from '@nestjs/common';
import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { LogsService } from '../logs/logs.service';

@Controller('songs')
export class SongsController {
  constructor(
    private readonly songsService: SongsService,
    private readonly logsService: LogsService,
  ) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('tag') tagId?: string,
  ) {
    return this.songsService.findAll({
      search,
      tagId: tagId ? parseInt(tagId, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.songsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createSongDto: CreateSongDto,
    @Request() req: any,
    @Headers('user-agent') userAgent?: string,
  ) {
    const song = await this.songsService.create(createSongDto, req.user.id);
    await this.logsService.info('song.create', `Song created: ${createSongDto.name}`, {
      userId: req.user.id,
      username: req.user.username,
      ipAddress: req.ip,
      userAgent,
      metadata: { songId: song.id, songName: song.name },
    });
    return song;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSongDto: Partial<CreateSongDto>,
    @Request() req: any,
    @Headers('user-agent') userAgent?: string,
  ) {
    // Check ownership or admin
    const song = await this.songsService.findOneRaw(id);
    if (!song) {
      throw new NotFoundException('Song not found');
    }

    const isOwner = song.user_id === req.user.id;
    const isAdmin = req.user.is_admin;

    if (!isOwner && !isAdmin) {
      await this.logsService.warn('song.update_denied', `Unauthorized song update attempt on: ${song.name}`, {
        userId: req.user.id,
        username: req.user.username,
        ipAddress: req.ip,
        userAgent,
        metadata: { songId: id, songOwnerId: song.user_id },
      });
      throw new ForbiddenException('You can only edit your own songs');
    }

    const updatedSong = await this.songsService.update(id, updateSongDto);
    await this.logsService.info('song.update', `Song updated: ${song.name}`, {
      userId: req.user.id,
      username: req.user.username,
      ipAddress: req.ip,
      userAgent,
      metadata: { songId: id },
    });
    return updatedSong;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Headers('user-agent') userAgent?: string,
  ) {
    // Check ownership or admin
    const song = await this.songsService.findOneRaw(id);
    if (!song) {
      throw new NotFoundException('Song not found');
    }

    const isOwner = song.user_id === req.user.id;
    const isAdmin = req.user.is_admin;

    if (!isOwner && !isAdmin) {
      await this.logsService.warn('song.delete_denied', `Unauthorized song delete attempt on: ${song.name}`, {
        userId: req.user.id,
        username: req.user.username,
        ipAddress: req.ip,
        userAgent,
        metadata: { songId: id, songOwnerId: song.user_id },
      });
      throw new ForbiddenException('You can only delete your own songs');
    }

    const deletedSong = await this.songsService.delete(id);
    await this.logsService.info('song.delete', `Song deleted: ${song.name}`, {
      userId: req.user.id,
      username: req.user.username,
      ipAddress: req.ip,
      userAgent,
      metadata: { songId: id, songName: song.name },
    });
    return { message: 'Song deleted', song: deletedSong };
  }

  // Tablature measure endpoints
  @Post(':id/measures')
  @UseGuards(JwtAuthGuard)
  async addMeasure(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { measure: any; position?: number },
    @Request() req: any,
  ) {
    const song = await this.songsService.findOneRaw(id);
    if (!song) {
      throw new NotFoundException('Song not found');
    }

    const isOwner = song.user_id === req.user.id;
    const isAdmin = req.user.is_admin;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only edit your own songs');
    }

    return this.songsService.addMeasure(id, body.measure, body.position);
  }

  @Put(':id/measures/:measureIndex')
  @UseGuards(JwtAuthGuard)
  async updateMeasure(
    @Param('id', ParseIntPipe) id: number,
    @Param('measureIndex', ParseIntPipe) measureIndex: number,
    @Body() body: { measure: any },
    @Request() req: any,
  ) {
    const song = await this.songsService.findOneRaw(id);
    if (!song) {
      throw new NotFoundException('Song not found');
    }

    const isOwner = song.user_id === req.user.id;
    const isAdmin = req.user.is_admin;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only edit your own songs');
    }

    return this.songsService.updateMeasure(id, measureIndex, body.measure);
  }

  @Delete(':id/measures/:measureIndex')
  @UseGuards(JwtAuthGuard)
  async removeMeasure(
    @Param('id', ParseIntPipe) id: number,
    @Param('measureIndex', ParseIntPipe) measureIndex: number,
    @Request() req: any,
  ) {
    const song = await this.songsService.findOneRaw(id);
    if (!song) {
      throw new NotFoundException('Song not found');
    }

    const isOwner = song.user_id === req.user.id;
    const isAdmin = req.user.is_admin;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only edit your own songs');
    }

    return this.songsService.removeMeasure(id, measureIndex);
  }
}
