import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BasicService } from '../../service/basic.service';

interface Product {
    id?: number;
    name: string;
    description?: string;
    price: number;
    stock: number;
    sku?: string;
    activo?: boolean;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class Products implements OnInit {
    products = signal<Product[]>([]);
    loading = signal(false);
    showForm = signal(false);
    isEditing = signal(false);
    
    currentProduct: Product = {
        name: '',
        description: '',
        price: 0,
        stock: 0,
        sku: '',
        activo: true
    };

    constructor(private readonly service: BasicService) {}

    ngOnInit(): void {
        this.loadProducts();
    }

    loadProducts(): void {
        this.loading.set(true);
        this.service.basePost('productcontroller/getall', {}).subscribe({
            next: (data: Product[]) => {
                this.products.set(data || []);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error al cargar:', err);
                this.loading.set(false);
            }
        });
    }

    openCreateForm(): void {
        this.currentProduct = {
            name: '',
            description: '',
            price: 0,
            stock: 0,
            sku: '',
            activo: true
        };
        this.isEditing.set(false);
        this.showForm.set(true);
    }

    openEditForm(product: Product): void {
        // Asegurar que todos los campos tengan valores válidos
        this.currentProduct = {
            id: product.id,
            name: product.name || '',
            description: product.description || '',
            price: Number(product.price) || 0,
            stock: Number(product.stock) || 0,
            sku: product.sku || '',
            activo: product.activo !== undefined ? product.activo : true
        };
        this.isEditing.set(true);
        this.showForm.set(true);
    }

    closeForm(): void {
        this.showForm.set(false);
    }

    saveProduct(): void {
        // Validaciones
        if (!this.currentProduct.name || this.currentProduct.name.trim() === '') {
            alert('El nombre del producto es obligatorio');
            return;
        }
        if (this.currentProduct.price <= 0) {
            alert('El precio debe ser mayor a 0');
            return;
        }
        if (this.currentProduct.stock < 0) {
            alert('El stock no puede ser negativo');
            return;
        }

        this.loading.set(true);
        
        // Limpiar y formatear datos correctamente
        let datosAEnviar: any = {
            name: this.currentProduct.name.trim(),
            price: Number(this.currentProduct.price),
            stock: Number(this.currentProduct.stock),
            activo: this.currentProduct.activo === true
        };
        
        // Agregar campos opcionales solo si tienen valor
        if (this.currentProduct.description && this.currentProduct.description.trim() !== '') {
            datosAEnviar.description = this.currentProduct.description.trim();
        }
        
        if (this.currentProduct.sku && this.currentProduct.sku.trim() !== '') {
            datosAEnviar.sku = this.currentProduct.sku.trim();
        }
        
        // Si es edición, incluir el ID
        if (this.isEditing() && this.currentProduct.id) {
            datosAEnviar.id = Number(this.currentProduct.id);
        }
        
        console.log('📤 Enviando datos limpios:', datosAEnviar);
        
        this.service.basePost('productcontroller/save', datosAEnviar).subscribe({
            next: (respuesta) => {
                console.log('✅ Respuesta:', respuesta);
                this.loadProducts();
                this.closeForm();
                alert(this.isEditing() ? '✅ Producto actualizado' : '✅ Producto creado');
                this.loading.set(false);
            },
            error: (err) => {
                console.error('❌ Error detallado:', err);
                let mensajeError = 'Error al guardar producto';
                if (err.error && err.error.message) {
                    mensajeError += ': ' + err.error.message;
                } else if (err.message) {
                    mensajeError += ': ' + err.message;
                }
                alert(mensajeError);
                this.loading.set(false);
            }
        });
    }

    deleteProduct(product: Product): void {
        if (!confirm(`¿Eliminar "${product.name}"?`)) return;
        
        this.loading.set(true);
        this.service.basePost(`productcontroller/delete/${product.id}`, {}).subscribe({
            next: () => {
                this.loadProducts();
                alert('✅ Producto eliminado');
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error:', err);
                alert('❌ Error al eliminar producto');
                this.loading.set(false);
            }
        });
    }
}