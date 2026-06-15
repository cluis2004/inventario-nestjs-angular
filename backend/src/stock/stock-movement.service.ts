import { Injectable, NotFoundException } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { Product } from "../products/model/product.model";

type StockMovementDetail = {
    product_id: number;
    quantity: number;
};

@Injectable()
export class StockMovementService {
    async applyStockMovement(
        manager: EntityManager,
        details: StockMovementDetail[],
        multiplier: 1 | -1,
    ) {
        const productRepository = manager.getRepository(Product);
        const accumulated = new Map<number, number>();

        // Primero juntamos las cantidades por producto para no actualizar muchas veces el mismo stock.
        for (const detail of details) {
            const quantity = Number(detail.quantity) * multiplier;
            accumulated.set(detail.product_id, (accumulated.get(detail.product_id) ?? 0) + quantity);
        }

        // multiplier = 1 suma stock y multiplier = -1 descuenta stock.
        for (const [productId, delta] of accumulated.entries()) {
            const product = await productRepository.findOne({ where: { id: productId } });
            if (!product) throw new NotFoundException(`Producto con id ${productId} no encontrado`);

            // Aqui calculamos como quedaria el stock final del producto.
            const nextStock = Number(product.stock) + delta;
            if (nextStock < 0) {
                throw new Error(`El stock del producto ${product.name} no puede quedar negativo`);
            }

            // Si todo esta bien, guardamos el nuevo stock.
            product.stock = nextStock;
            await productRepository.save(product);
        }
    }
}
