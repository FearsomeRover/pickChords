import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';

export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  private toTag(dbTag: any): Tag {
    return {
      id: dbTag.id,
      name: dbTag.name,
      color: dbTag.color,
      created_at: dbTag.createdAt.toISOString(),
    };
  }

  async findAll(): Promise<Tag[]> {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
    return tags.map(this.toTag);
  }

  async findByIds(ids: number[]): Promise<Tag[]> {
    if (ids.length === 0) return [];

    const tags = await this.prisma.tag.findMany({
      where: { id: { in: ids } },
      orderBy: { name: 'asc' },
    });
    return tags.map(this.toTag);
  }

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const { name, color = '#5b8bd4' } = createTagDto;

    const tag = await this.prisma.tag.create({
      data: { name, color },
    });

    return this.toTag(tag);
  }

  async delete(id: number): Promise<Tag> {
    try {
      const tag = await this.prisma.tag.delete({
        where: { id },
      });
      return this.toTag(tag);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Tag not found');
      }
      throw error;
    }
  }
}
