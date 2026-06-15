import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Repository } from "typeorm";
import { Product } from "../products/model/product.model";
import { StockMovementService } from "../stock/stock-movement.service";
import { Usuario } from "../usuario/model/usuario.model";
import { SaleHeaderDto } from "./dto/sale-header.dto";
import { SaleDetail } from "./model/sale-detail.model";
import { SaleHeader } from "./model/sale-header.model";

@Injectable()
export class SalesService {
    constructor(
        @InjectRepository(SaleHeader)
        private readonly saleHeaderRepository: Repository<SaleHeader>,
        @InjectRepository(SaleDetail)
        private readonly saleDetailRepository: Repository<SaleDetail>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(Usuario)
        private readonly usuarioRepository: Repository<Usuario>,
        private readonly stockMovementService: StockMovementService,
    ) {}

    getAll() {
        return this.saleHeaderRepository.find({
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
        return this.findSaleOrFail(id, this.saleHeaderRepository.manager);
    }

    async save(data: SaleHeaderDto) {
        const isNew = !data.id || data.id === 0;

        // Todo se hace en una transaccion para que cabecera, detalle y stock queden consistentes.
        return this.saleHeaderRepository.manager.transaction(async (manager) => {
            const saleHeaderRepository = manager.getRepository(SaleHeader);
            const saleDetailRepository = manager.getRepository(SaleDetail);

            if (!data.details?.length) {
                throw new Error('La venta debe incluir al menos un detalle');
            }

            await this.ensureProductsExist(data.details.map((detail) => detail.product_id));
            await this.ensureUserExists(data.user_id);

            const mappedDetails = data.details.map((detail) => {
                const quantity = Number(detail.quantity);
                const unitPrice = Number(detail.unit_price);
                const lineTotal = Number((quantity * unitPrice).toFixed(2));

                return saleDetailRepository.create({
                    product_id: detail.product_id,
                    quantity,
                    unit_price: unitPrice,
                    line_total: lineTotal,
                });
            });

            const totalAmount = Number(
                mappedDetails.reduce((sum, detail) => sum + Number(detail.line_total), 0).toFixed(2),
            );

            const saleDate = data.sale_date ? new Date(data.sale_date) : new Date();
            const isActive = data.is_active ?? true;

            if (isNew) {
                // Si la venta es nueva, primero guardamos la cabecera.
                const header = saleHeaderRepository.create({
                    sale_date: saleDate,
                    total_amount: totalAmount,
                    is_active: isActive,
                    user_id: data.user_id,
                });

                const savedHeader = await saleHeaderRepository.save(header);
                const detailsToSave = mappedDetails.map((detail) =>
                    saleDetailRepository.create({
                        ...detail,
                        sale_header_id: savedHeader.id,
                    }),
                );

                await saleDetailRepository.save(detailsToSave);

                // Una venta activa descuenta stock.
                if (isActive) {
                    await this.stockMovementService.applyStockMovement(manager, detailsToSave, -1);
                }
                return this.findSaleOrFail(savedHeader.id, manager);
            }

            const existing = await saleHeaderRepository.findOne({
                where: { id: data.id },
                relations: { details: true },
            });

            if (!existing) throw new NotFoundException(`Venta con id ${data.id} no encontrado`);

            // Si la venta anterior estaba activa, devolvemos ese stock antes de recalcular todo.
            if (existing.is_active) {
                await this.stockMovementService.applyStockMovement(manager, existing.details, 1);
            }

            existing.sale_date = saleDate;
            existing.total_amount = totalAmount;
            existing.is_active = isActive;
            existing.user_id = data.user_id;

            await saleHeaderRepository.save(existing);
            await saleDetailRepository.delete({ sale_header_id: existing.id });

            const detailsToSave = mappedDetails.map((detail) =>
                saleDetailRepository.create({
                    ...detail,
                    sale_header_id: existing.id,
                }),
            );

            await saleDetailRepository.save(detailsToSave);

            // Despues de guardar el nuevo detalle, volvemos a descontar si sigue activa.
            if (isActive) {
                await this.stockMovementService.applyStockMovement(manager, detailsToSave, -1);
            }
            return this.findSaleOrFail(existing.id, manager);
        });
    }

    async delete(id: number) {
        // En realidad aqui no borramos la venta, solo la anulamos.
        return this.saleHeaderRepository.manager.transaction(async (manager) => {
            const saleHeaderRepository = manager.getRepository(SaleHeader);
            const sale = await saleHeaderRepository.findOne({
                where: { id },
                relations: { details: true },
            });

            if (!sale) throw new NotFoundException(`Venta con id ${id} no encontrado`);
            if (sale.is_active === false) return 'La venta ya estaba anulada';

            // Al anular una venta, el stock vendido vuelve al inventario.
            await this.stockMovementService.applyStockMovement(manager, sale.details, 1);
            sale.is_active = false;
            await saleHeaderRepository.save(sale);
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

    private async findSaleOrFail(id: number, manager: EntityManager) {
        const sale = await manager.getRepository(SaleHeader).findOne({
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

        if (!sale) throw new NotFoundException(`Venta con id ${id} no encontrado`);
        return sale;
    }
}
