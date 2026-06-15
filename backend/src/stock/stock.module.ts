import { Module } from '@nestjs/common';
import { StockMovementService } from './stock-movement.service';

@Module({
  providers: [StockMovementService],
  exports: [StockMovementService],
})
export class StockModule {}
