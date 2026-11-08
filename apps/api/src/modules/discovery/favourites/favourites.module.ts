import { Module } from '@nestjs/common';
import { BlocksModule } from '../../trust/blocks/blocks.module';
import { FavouritesController } from './favourites.controller';
import { FavouritesService } from './favourites.service';

@Module({
  imports: [BlocksModule],
  controllers: [FavouritesController],
  providers: [FavouritesService],
  exports: [FavouritesService],
})
export class FavouritesModule {}
