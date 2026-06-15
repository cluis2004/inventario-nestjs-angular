import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/model/product.model';
import { StockModule } from '../stock/stock.module';
import { Usuario } from '../usuario/model/usuario.model';
import { SaleDetail } from './model/sale-detail.model';
import { SaleHeader } from './model/sale-header.model';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [TypeOrmModule.forFeature([SaleHeader, SaleDetail, Product, Usuario]), StockModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
