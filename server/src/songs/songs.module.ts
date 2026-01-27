import { Module } from '@nestjs/common';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { ChordsModule } from '../chords/chords.module';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [ChordsModule, TagsModule],
  controllers: [SongsController],
  providers: [SongsService],
  exports: [SongsService],
})
export class SongsModule {}
