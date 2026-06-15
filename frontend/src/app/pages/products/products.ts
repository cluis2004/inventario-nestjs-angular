import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BasicService } from '../../service/basic.service';

interface Product {
    id?: number;
    name: string;
    price: number;
    stock: number;
    sku?: string;
    activo?: boolean;
    created_at?: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.html'
})
export class Products implements OnInit {
    products = signal<Product[]>([]);
    loading = signal(false);
    showForm = signal(false);
    isEditing = signal(false);
    searchTerm = '';
    
    currentProduct: Product = {
        name: '',
        price: 0,
        stock: 0,
        sku: '',
        activo: true
    };

    constructor(private readonly service: BasicService) {}

    ngOnInit(): void {
        this.loadProducts();
    }

    loadProducts(onLoaded?: () => void): void {
        this.loading.set(true);
        this.service.basePost('productcontroller/getall', {}).subscribe({
            next: (data: Product[] | { data?: Product[] }) => {
                this.products.set(this.normalizeProducts(data));
                this.loading.set(false);
                onLoaded?.();
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
        const sanitizedName = this.sanitizeProductName(this.currentProduct.name);
        const sanitizedSku = this.sanitizeSku(this.currentProduct.sku || '');
        const normalizedPrice = this.sanitizeDecimal(this.currentProduct.price, 2);
        const normalizedStock = this.sanitizeInteger(this.currentProduct.stock);

        this.currentProduct = {
            ...this.currentProduct,
            name: sanitizedName,
            sku: sanitizedSku,
            price: normalizedPrice,
            stock: normalizedStock,
        };

        if (!sanitizedName) {
            alert('El nombre del producto es obligatorio');
            return;
        }
        if (!this.isValidProductName(sanitizedName)) {
            alert('El nombre solo debe contener letras, números y símbolos simples');
            return;
        }
        if (normalizedPrice <= 0) {
            alert('El precio debe ser mayor a 0');
            return;
        }
        if (normalizedPrice > MAX_PRODUCT_PRICE) {
            alert('El precio no puede ser mayor a Bs. 99999999.99');
            return;
        }
        if (normalizedStock < 0) {
            alert('El stock no puede ser negativo');
            return;
        }
        if (!Number.isInteger(normalizedStock)) {
            alert('El stock solo puede manejar números enteros');
            return;
        }
        if (normalizedStock > MAX_PRODUCT_STOCK) {
            alert('El stock no puede ser mayor a 999999');
            return;
        }
        if (sanitizedSku && !this.isValidSku(sanitizedSku)) {
            alert('El código contiene caracteres no permitidos');
            return;
        }

        this.loading.set(true);
        
        let datosAEnviar: any = {
            name: sanitizedName,
            price: normalizedPrice,
            stock: normalizedStock,
            activo: this.currentProduct.activo === true
        };
        
        if (sanitizedSku) {
            datosAEnviar.sku = sanitizedSku;
        }
        
        if (this.isEditing() && this.currentProduct.id) {
            datosAEnviar.id = Number(this.currentProduct.id);
        }

        this.service.basePost('productcontroller/save', datosAEnviar).subscribe({
            next: () => {
                this.loadProducts(() => {
                    this.closeForm();
                });
            },
            error: (err) => {
                console.error('Error detallado:', err);
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

    deactivateProduct(product: Product): void {
        if (!product.id) return;
        if (product.activo === false) return;
        if (!confirm(`¿Inactivar "${product.name}"? El producto se conservará en el historial.`)) return;

        this.loading.set(true);
        this.service.basePost(`productcontroller/delete/${product.id}`, {}).subscribe({
            next: () => {
                this.loadProducts();
            },
            error: (err) => {
                console.error('Error:', err);
                alert('Error al desactivar producto');
                this.loading.set(false);
            }
        });
    }

    onNameChange(value: string): void {
        this.currentProduct.name = this.sanitizeProductName(value);
    }

    onSkuChange(value: string): void {
        this.currentProduct.sku = this.sanitizeSku(value);
    }

    onPriceChange(value: number | string): void {
        this.currentProduct.price = this.sanitizeDecimal(value, 2);
    }

    onStockChange(value: number | string): void {
        this.currentProduct.stock = this.sanitizeInteger(value);
    }

    formatBs(value: number | string): string {
        return `Bs. ${Number(value || 0).toFixed(2)}`;
    }

    formatDate(value?: string): string {
        if (!value) return '-';
        return new Date(value).toLocaleString();
    }

    onSearchChange(value: string): void {
        this.searchTerm = this.sanitizeSearch(value);
    }

    getFilteredProducts(): Product[] {
        const tokens = this.getSearchTokens(this.searchTerm);
        if (!tokens.length) return this.products();

        return this.products().filter((product) => {
            const haystack = this.normalizeSearch(`${product.name} ${product.sku || ''} ${product.id || ''}`);
            return tokens.every((token) => haystack.includes(token));
        });
    }

    hasFilteredProducts(): boolean {
        return this.getFilteredProducts().length > 0;
    }

    toggleProductStatus(product: Product): void {
        this.loading.set(true);
        this.service.basePost('productcontroller/save', {
            id: Number(product.id),
            name: product.name,
            price: Number(product.price),
            stock: Number(product.stock),
            sku: product.sku?.trim() || undefined,
            activo: product.activo === false,
        }).subscribe({
            next: () => {
                this.loadProducts();
            },
            error: (err) => {
                console.error('Error:', err);
                alert('Error al cambiar el estado del producto');
                this.loading.set(false);
            }
        });
    }

    private sanitizeProductName(value: string): string {
        return (value || '')
            .replace(/[^\p{L}\p{N}\s.,()\-_/]/gu, '')
            .replace(/\s+/g, ' ')
            .trimStart()
            .slice(0, 80);
    }

    private sanitizeSku(value: string): string {
        return (value || '')
            .replace(/[^A-Za-z0-9._\-\/]/g, '')
            .slice(0, 30);
    }

    private sanitizeSearch(value: string): string {
        return (value || '')
            .replace(/[^\p{L}\p{N}\s._\-\/]/gu, '')
            .replace(/\s+/g, ' ')
            .trimStart()
            .slice(0, 80);
    }

    private normalizeSearch(value: string): string {
        return this.sanitizeSearch(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    private getSearchTokens(value: string): string[] {
        return this.normalizeSearch(value).split(' ').filter(Boolean);
    }

    private sanitizeInteger(value: number | string): number {
        const cleaned = String(value ?? '').replace(/[^\d-]/g, '');
        const parsed = Number(cleaned);
        if (!Number.isFinite(parsed)) return 0;
        return Math.min(MAX_PRODUCT_STOCK, Math.max(0, Math.trunc(parsed)));
    }

    private sanitizeDecimal(value: number | string, decimals = 2): number {
        const cleaned = String(value ?? '').replace(/[^0-9.]/g, '');
        const parsed = Number(cleaned);
        if (!Number.isFinite(parsed)) return 0;
        return Number(Math.min(MAX_PRODUCT_PRICE, Math.max(0, parsed)).toFixed(decimals));
    }

    private isValidProductName(value: string): boolean {
        return /^[\p{L}\p{N}][\p{L}\p{N}\s.,()\-_/]*$/u.test(value);
    }

    private isValidSku(value: string): boolean {
        return /^[A-Za-z0-9._\-\/]+$/.test(value);
    }

    private normalizeProducts(data: Product[] | { data?: Product[] } | null | undefined): Product[] {
        const rows = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
                ? data.data
                : [];

        return rows.map((product) => ({
            id: product.id ? Number(product.id) : undefined,
            name: product.name || '',
            price: Number(product.price || 0),
            stock: Number(product.stock || 0),
            sku: product.sku || '',
            activo: product.activo !== false,
            created_at: product.created_at,
        }));
    }
}

const MAX_PRODUCT_STOCK = 999999;
const MAX_PRODUCT_PRICE = 99999999.99;
