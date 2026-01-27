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
} from '@nestjs/common';
import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song.dto';
import { OptionalJwtAuthGuard } from '../auth/auth.guard';

@Controller('songs')
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('tag') tagId?: string,
    @Query('favorites') favorites?: string,
  ) {
    return this.songsService.findAll({
      search,
      tagId: tagId ? parseInt(tagId, 10) : undefined,
      favorites: favorites === 'true',
      userId: req.user?.id,
    });
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.songsService.findOne(id, req.user?.id);
  }

  @Post()
  create(@Body() createSongDto: CreateSongDto) {
    return this.songsService.create(createSongDto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSongDto: Partial<CreateSongDto>,
  ) {
    return this.songsService.update(id, updateSongDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    const song = await this.songsService.delete(id);
    return { message: 'Song deleted', song };
  }
}
