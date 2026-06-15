import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { StockEntryModule } from './stock-entry/stock-entry.module';
import { UsuarioModule } from './usuario/usuario.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL') || configService.get<string>('DATABASE_PUBLIC_URL');
        return {
          type: 'postgres' as const,
          url: databaseUrl || 'postgresql://postgres:postgres@localhost:5432/postgres',
          autoLoadEntities: true,
          synchronize: true,
          ssl: databaseUrl && !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1')
            ? { rejectUnauthorized: false }
            : false,
        };
      },
    }),
    ProductsModule,
    SalesModule,
    StockEntryModule,
    UsuarioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}