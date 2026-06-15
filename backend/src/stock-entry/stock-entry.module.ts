import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/model/product.model';
import { StockModule } from '../stock/stock.module';
import { Usuario } from '../usuario/model/usuario.model';
import { StockEntryDetail } from './model/stock-entry-detail.model';
import { StockEntry } from './model/stock-entry.model';
import { StockEntryController } from './stock-entry.controller';
import { StockEntryService } from './stock-entry.service';

@Module({
  imports: [TypeOrmModule.forFeature([StockEntry, StockEntryDetail, Product, Usuario]), StockModule],
  controllers: [StockEntryController],
  providers: [StockEntryService],
  exports: [StockEntryService],
})
export class StockEntryModule {}
