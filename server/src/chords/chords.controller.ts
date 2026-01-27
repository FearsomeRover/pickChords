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
} from '@nestjs/common';
import { ChordsService } from './chords.service';
import { CreateChordDto } from './dto/create-chord.dto';

@Controller('chords')
export class ChordsController {
  constructor(private readonly chordsService: ChordsService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.chordsService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chordsService.findOne(id);
  }

  @Post()
  create(@Body() createChordDto: CreateChordDto) {
    return this.chordsService.create(createChordDto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChordDto: Partial<CreateChordDto>,
  ) {
    return this.chordsService.update(id, updateChordDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    const chord = await this.chordsService.delete(id);
    return { message: 'Chord deleted', chord };
  }
}
