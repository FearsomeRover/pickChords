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
  Headers,
} from '@nestjs/common';
import { ChordsService } from './chords.service';
import { CreateChordDto } from './dto/create-chord.dto';
import { JwtAuthGuard, AdminGuard } from '../auth/auth.guard';
import { LogsService } from '../logs/logs.service';

@Controller('chords')
export class ChordsController {
  constructor(
    private readonly chordsService: ChordsService,
    private readonly logsService: LogsService,
  ) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.chordsService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chordsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(
    @Body() createChordDto: CreateChordDto,
    @Request() req: any,
    @Headers('user-agent') userAgent?: string,
  ) {
    const chord = await this.chordsService.create(createChordDto);
    await this.logsService.info('chord.create', `Chord created: ${createChordDto.name}`, {
      userId: req.user.id,
      username: req.user.username,
      ipAddress: req.ip,
      userAgent,
      metadata: { chordId: chord.id, chordName: chord.name },
    });
    return chord;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChordDto: Partial<CreateChordDto>,
    @Request() req: any,
    @Headers('user-agent') userAgent?: string,
  ) {
    const chord = await this.chordsService.update(id, updateChordDto);
    await this.logsService.info('chord.update', `Chord updated: ${chord.name}`, {
      userId: req.user.id,
      username: req.user.username,
      ipAddress: req.ip,
      userAgent,
      metadata: { chordId: id, chordName: chord.name },
    });
    return chord;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Headers('user-agent') userAgent?: string,
  ) {
    const chord = await this.chordsService.delete(id);
    await this.logsService.info('chord.delete', `Chord deleted: ${chord.name}`, {
      userId: req.user.id,
      username: req.user.username,
      ipAddress: req.ip,
      userAgent,
      metadata: { chordId: id, chordName: chord.name },
    });
    return { message: 'Chord deleted', chord };
  }
}
