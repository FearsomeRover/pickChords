import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { ChordsModule } from './chords/chords.module';
import { AuthModule } from './auth/auth.module';
import { TagsModule } from './tags/tags.module';
import { SongsModule } from './songs/songs.module';
import { FavoritesModule } from './favorites/favorites.module';
import { LogsModule } from './logs/logs.module';
import { ProgressModule } from './progress/progress.module';

@Module({
  imports: [
    DatabaseModule,
    LogsModule,
    ChordsModule,
    AuthModule,
    TagsModule,
    SongsModule,
    FavoritesModule,
    ProgressModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
