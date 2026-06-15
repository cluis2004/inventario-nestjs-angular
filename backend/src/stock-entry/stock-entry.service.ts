import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Repository } from "typeorm";
import { Product } from "../products/model/product.model";
import { StockMovementService } from "../stock/stock-movement.service";
import { Usuario } from "../usuario/model/usuario.model";
import { StockEntryDto } from "./dto/stock-entry.dto";
import { StockEntryDetail } from "./model/stock-entry-detail.model";
import { StockEntry } from "./model/stock-entry.model";

@Injectable()
export class StockEntryService {
    constructor(
        @InjectRepository(StockEntry)
        private readonly stockEntryRepository: Repository<StockEntry>,
        @InjectRepository(StockEntryDetail)
        private readonly stockEntryDetailRepository: Repository<StockEntryDetail>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(Usuario)
        private readonly usuarioRepository: Repository<Usuario>,
        private readonly stockMovementService: StockMovementService,
    ) {}

    getAll() {
        return this.stockEntryRepository.find({
            order: { id: 'DESC' },
            relations: {
                user: true,
                details: {
                    product: true,
                },
            },
        });
    }

    async getById(id: number) {
        return this.findStockEntryOrFail(id, this.stockEntryRepository.manager);
    }

    async save(data: StockEntryDto) {
        const isNew = !data.id || data.id === 0;

        // Usamos transaccion para que entrada, detalle y stock se guarden juntos.
        return this.stockEntryRepository.manager.transaction(async (manager) => {
            const stockEntryRepository = manager.getRepository(StockEntry);
            const stockEntryDetailRepository = manager.getRepository(StockEntryDetail);

            if (!data.details?.length) {
                throw new Error('La entrada debe incluir al menos un detalle');
            }

            await this.ensureProductsExist(data.details.map((detail) => detail.product_id));
            await this.ensureUserExists(data.user_id);

            const entryDate = data.entry_date ? new Date(data.entry_date) : new Date();
            const status = data.status ?? 'registered';
            const detailEntities = data.details.map((detail) =>
                stockEntryDetailRepository.create({
                    product_id: detail.product_id,
                    quantity: Number(detail.quantity),
                }),
            );

            if (isNew) {
                // Primero guardamos la cabecera de la entrada.
                const header = stockEntryRepository.create({
                    user_id: data.user_id,
                    entry_date: entryDate,
                    status,
                });

                const savedHeader = await stockEntryRepository.save(header);
                const detailsToSave = detailEntities.map((detail) =>
                    stockEntryDetailRepository.create({
                        ...detail,
                        stock_entry_id: savedHeader.id,
                    }),
                );

                await stockEntryDetailRepository.save(detailsToSave);

                // Una entrada registrada suma stock al inventario.
                if (status === 'registered') {
                    await this.stockMovementService.applyStockMovement(manager, detailsToSave, 1);
                }

                return this.findStockEntryOrFail(savedHeader.id, manager);
            }

            const existing = await stockEntryRepository.findOne({
                where: { id: data.id },
                relations: { details: true },
            });

            if (!existing) throw new NotFoundException(`Entrada con id ${data.id} no encontrado`);

            // Si la entrada anterior estaba registrada, primero revertimos ese movimiento.
            if (existing.status === 'registered') {
                await this.stockMovementService.applyStockMovement(manager, existing.details, -1);
            }

            existing.user_id = data.user_id;
            existing.entry_date = entryDate;
            existing.status = status;

            await stockEntryRepository.save(existing);
            await stockEntryDetailRepository.delete({ stock_entry_id: existing.id });

            const detailsToSave = detailEntities.map((detail) =>
                stockEntryDetailRepository.create({
                    ...detail,
                    stock_entry_id: existing.id,
                }),
            );

            await stockEntryDetailRepository.save(detailsToSave);

            // Luego aplicamos otra vez el stock segun el nuevo estado y detalle.
            if (status === 'registered') {
                await this.stockMovementService.applyStockMovement(manager, detailsToSave, 1);
            }

            return this.findStockEntryOrFail(existing.id, manager);
        });
    }

    async delete(id: number) {
        // En realidad aqui no borramos la entrada, solo la anulamos.
        return this.stockEntryRepository.manager.transaction(async (manager) => {
            const stockEntryRepository = manager.getRepository(StockEntry);

            const entry = await stockEntryRepository.findOne({
                where: { id },
                relations: { details: true },
            });

            if (!entry) throw new NotFoundException(`Entrada con id ${id} no encontrado`);
            if (entry.status === 'cancelled') return 'La entrada ya estaba anulada';

            if (entry.status === 'registered') {
                // Al anular una entrada registrada, quitamos del stock lo que antes se habia sumado.
                await this.stockMovementService.applyStockMovement(manager, entry.details, -1);
            }

            entry.status = 'cancelled';
            await stockEntryRepository.save(entry);
            return 'Se anulo correctamente!!!';
        });
    }

    private async ensureProductsExist(productIds: number[]) {
        const uniqueIds = [...new Set(productIds)];
        const products = await this.productRepository.findBy({
            id: In(uniqueIds),
        });

        if (products.length !== uniqueIds.length) {
            const foundIds = new Set(products.map((product) => product.id));
            const missingId = uniqueIds.find((id) => !foundIds.has(id));
            throw new NotFoundException(`Producto con id ${missingId} no encontrado`);
        }
    }

    private async ensureUserExists(userId: number) {
        const user = await this.usuarioRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
        }
    }

    private async findStockEntryOrFail(id: number, manager: EntityManager) {
        const entry = await manager.getRepository(StockEntry).findOne({
            where: { id },
            relations: {
                user: true,
                details: {
                    product: true,
                },
            },
            order: {
                details: {
                    id: 'ASC',
                },
            },
        });

        if (!entry) throw new NotFoundException(`Entrada con id ${id} no encontrado`);
        return entry;
    }
}
