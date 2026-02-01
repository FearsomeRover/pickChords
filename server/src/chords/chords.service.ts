import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateChordDto } from './dto/create-chord.dto';
import { ChordDto, StringData } from './dto/chord.dto';

@Injectable()
export class ChordsService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(chord: any): ChordDto {
    return {
      id: chord.id,
      name: chord.name,
      strings: chord.strings as StringData[],
      start_fret: chord.startFret,
      created_at: chord.createdAt.toISOString(),
    };
  }

  async findAll(search?: string): Promise<ChordDto[]> {
    const chords = await this.prisma.chord.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : undefined,
      orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
    });

    return chords.map(this.toDto);
  }

  async findOne(id: number): Promise<ChordDto> {
    const chord = await this.prisma.chord.findUnique({
      where: { id },
    });

    if (!chord) {
      throw new NotFoundException('Chord not found');
    }

    return this.toDto(chord);
  }

  async findByIds(ids: number[]): Promise<ChordDto[]> {
    if (ids.length === 0) return [];

    const chords = await this.prisma.chord.findMany({
      where: { id: { in: ids } },
      orderBy: { name: 'asc' },
    });

    return chords.map(this.toDto);
  }

  async create(createChordDto: CreateChordDto): Promise<ChordDto> {
    const { name, strings, start_fret = 1 } = createChordDto;

    const chord = await this.prisma.chord.create({
      data: {
        name,
        strings: strings as unknown as Prisma.InputJsonValue,
        startFret: start_fret,
      },
    });

    return this.toDto(chord);
  }

  async update(id: number, updateChordDto: Partial<CreateChordDto>): Promise<ChordDto> {
    const { name, strings, start_fret } = updateChordDto;

    try {
      const chord = await this.prisma.chord.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(strings !== undefined && { strings: strings as unknown as Prisma.InputJsonValue }),
          ...(start_fret !== undefined && { startFret: start_fret }),
        },
      });

      return this.toDto(chord);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Chord not found');
      }
      throw error;
    }
  }

  async delete(id: number): Promise<ChordDto> {
    try {
      const chord = await this.prisma.chord.delete({
        where: { id },
      });

      return this.toDto(chord);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Chord not found');
      }
      throw error;
    }
  }

  async incrementUsageCount(chordIds: number[]): Promise<void> {
    if (chordIds.length === 0) return;

    await this.prisma.chord.updateMany({
      where: { id: { in: chordIds } },
      data: { usageCount: { increment: 1 } },
    });
  }

  async decrementUsageCount(chordIds: number[]): Promise<void> {
    if (chordIds.length === 0) return;

    // Prisma doesn't support GREATEST in updateMany, so we use raw query
    await this.prisma.$executeRaw`
      UPDATE chords
      SET usage_count = GREATEST(usage_count - 1, 0)
      WHERE id = ANY(${chordIds}::int[])
    `;
  }
}
