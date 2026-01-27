import {
  Controller,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('songs')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':id/favorite')
  async addFavorite(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    await this.favoritesService.addFavorite(req.user.id, id);
    return { message: 'Added to favorites' };
  }

  @Delete(':id/favorite')
  async removeFavorite(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    await this.favoritesService.removeFavorite(req.user.id, id);
    return { message: 'Removed from favorites' };
  }
}
