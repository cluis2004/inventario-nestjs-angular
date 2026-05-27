import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "./model/product.model";
import { ProductDto } from "./dto/product.dto";

/**
 * Servicio encargado de gestionar la lógica de negocio del inventario de productos.
 * Realiza las operaciones de lectura, creación, actualización y eliminación
 * interactuando directamente con el repositorio de TypeORM.
 */
@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly repository: Repository<Product>,
    ) {}

    /**
     * Obtiene el listado de todos los productos registrados en el sistema,
     * ordenados por su ID de manera ascendente.
     * @returns Promesa con el arreglo de productos.
     */
    getAll() {
        return this.repository.find({
            order: { id: 'ASC' }
        });
    }

    /**
     * Busca un producto específico a través de su ID único.
     * @param id Identificador numérico del producto.
     * @returns Promesa con el producto encontrado o null si no existe.
     */
    getById(id: number) {
        return this.repository.findOne({ where: { id } });
    }

    /**
     * Guarda o actualiza la información de un producto.
     * - Si el producto no tiene ID (o es 0), se registra como un nuevo producto en el sistema.
     * - Si el producto ya tiene un ID asignado, se actualizan sus campos en la base de datos.
     * @param data DTO con la información del producto.
     * @returns Mensaje de confirmación en texto plano de la operación realizada.
     * @throws Error si se intenta actualizar un producto que no existe en la base de datos.
     */
    async save(data: ProductDto) {
        const isNew = !data.id || data.id === 0;

        if (!isNew) {
            const existing = await this.repository.findOneBy({ id: data.id });
            if (!existing) throw new Error(`Entidad con id ${data.id} no encontrado`);

            await this.repository.update({ id: data.id }, data);
            return 'Se actualizo correctamente!!!';
        } else {
            const entity = this.repository.create(data);
            await this.repository.save(entity);
            return 'Se guardo correctamente!!!';
        }
    }

    /**
     * Elimina físicamente un producto del sistema basándose en su ID.
     * Primero verifica la existencia del producto antes de proceder.
     * @param id Identificador numérico del producto a eliminar.
     * @returns Mensaje de confirmación en texto plano de la eliminación.
     * @throws Error si el producto con el ID especificado no es encontrado.
     */
    async delete(id: number) {
        const data = await this.findById(id);
        if (!data) throw new Error(`Entidad con id ${id} no encontrado`);

        await this.repository.delete({ id });
        return 'Se elimino correctamente!!!';
    }

    /**
     * Busca un producto por ID y lanza una excepción genérica si no es encontrado.
     * Método auxiliar utilizado principalmente antes de actualizar o eliminar.
     * @param id Identificador numérico del producto.
     * @returns El producto si es encontrado.
     * @throws Error si no se encuentra el producto.
     */
    async findById(id: number) {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) throw new Error(`Entidad con id ${id} no encontrado`);
        return entity;
    }
}
