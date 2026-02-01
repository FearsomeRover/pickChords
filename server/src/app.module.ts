import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ChordsModule } from './chords/chords.module';
import { AuthModule } from './auth/auth.module';
import { TagsModule } from './tags/tags.module';
import { SongsModule } from './songs/songs.module';
import { LogsModule } from './logs/logs.module';
import { ProgressModule } from './progress/progress.module';

@Module({
  imports: [
    PrismaModule,
    LogsModule,
    ChordsModule,
    AuthModule,
    TagsModule,
    SongsModule,
    ProgressModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
