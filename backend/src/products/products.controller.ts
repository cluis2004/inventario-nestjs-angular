import { Body, Controller, Param, ParseIntPipe, Post } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductDto } from "./dto/product.dto";

/**
 * Controlador que expone los endpoints HTTP para la gestión de productos (inventario).
 * Todas las rutas de consulta y mutación utilizan el método HTTP POST
 * siguiendo los lineamientos técnicos de la clase.
 */
@Controller("productcontroller")
export class ProductsController {
    constructor(
        private readonly service: ProductsService
    ) {}

    /**
     * Endpoint POST para obtener la lista completa de productos.
     * Ruta: /api/productcontroller/getall
     */
    @Post('getall')
    getAll() {
        return this.service.getAll();
    }

    /**
     * Endpoint POST para buscar un producto específico por su ID.
     * Ruta: /api/productcontroller/getbyid/:id
     * @param id Identificador numérico del producto (parseado automáticamente a número).
     */
    @Post('getbyid/:id')
    getById(@Param('id', ParseIntPipe) id: number) {
        return this.service.getById(id);
    }

    /**
     * Endpoint POST único para guardar o actualizar un producto.
     * Si no incluye ID, se creará un producto nuevo. Si incluye un ID existente, se actualizará.
     * Ruta: /api/productcontroller/save
     * @param data DTO con la información validada del producto.
     */
    @Post('save')
    async save(@Body() data: ProductDto) {
        return await this.service.save(data);
    }

    /**
     * Endpoint POST para eliminar un producto a través de su ID.
     * Ruta: /api/productcontroller/delete/:id
     * @param id Identificador numérico del producto a eliminar.
     */
    @Post('delete/:id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        return await this.service.delete(id);
    }
}
