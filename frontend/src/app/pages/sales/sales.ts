import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BasicService } from '../../service/basic.service';
import { SessionService } from '../../service/session.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Product {
  id: number;
  name: string;
  price: number | string;
  stock: number | string;
  sku?: string;
  activo?: boolean;
}

interface CartItem {
  product_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  stock: number;
  sku?: string;
}

const MAX_SALE_QUANTITY = 999999;

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sales.html'
})
export class Sales implements OnInit {
  products = signal<Product[]>([]);
  loading = signal(false);
  saving = signal(false);

  searchTerm = '';
  cart: CartItem[] = [];

  constructor(
    private readonly service: BasicService,
    private readonly session: SessionService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.service.basePost('productcontroller/getall', {}).subscribe({
      next: (data: Product[] | { data?: Product[] }) => {
        this.products.set(this.normalizeProducts(data));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.loading.set(false);
      }
    });
  }

  getFilteredProducts(): Product[] {
    const tokens = this.getSearchTokens(this.searchTerm);
    if (!tokens.length) return this.products();

    return this.products().filter((product) =>
      tokens.every((token) =>
        this.normalizeSearch(`${product.name} ${product.sku || ''} ${product.id}`).includes(token)
      )
    );
  }

  addProduct(product: Product): void {
    const stock = Number(product.stock || 0);
    const allowedMax = Math.min(stock, MAX_SALE_QUANTITY);
    if (stock <= 0) {
      alert(`"${product.name}" no tiene stock disponible`);
      return;
    }

    const existing = this.cart.find((item) => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= allowedMax) {
        alert(`No puedes vender más de ${allowedMax} unidades de "${product.name}"`);
        return;
      }

      existing.quantity += 1;
      this.cart = [...this.cart];
      return;
    }

    this.cart = [
      ...this.cart,
      {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        unit_price: Number(product.price || 0),
        stock,
        sku: product.sku || '',
      }
    ];
  }

  updateQuantity(index: number, nextValue: number | string): void {
    const item = this.cart[index];
    if (!item) return;
    const quantity = this.sanitizeInteger(nextValue, 1);
    item.quantity = Math.max(1, Math.min(item.stock, MAX_SALE_QUANTITY, Math.floor(quantity)));
    this.cart = [...this.cart];
  }

  increaseQuantity(index: number): void {
    const item = this.cart[index];
    if (!item) return;
    this.updateQuantity(index, item.quantity + 1);
  }

  decreaseQuantity(index: number): void {
    const item = this.cart[index];
    if (!item) return;
    this.updateQuantity(index, item.quantity - 1);
  }

  removeFromCart(index: number): void {
    this.cart = this.cart.filter((_, currentIndex) => currentIndex !== index);
  }

  clearCart(): void {
    this.cart = [];
  }

  getLineTotal(item: CartItem): number {
    return Number(item.quantity || 0) * Number(item.unit_price || 0);
  }

  getCartTotal(): number {
    return this.cart.reduce((sum, item) => sum + this.getLineTotal(item), 0);
  }

  getCartItemsCount(): number {
    return this.cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }

  hasSearchResults(): boolean {
    return this.getFilteredProducts().length > 0;
  }

  hasStock(product: Product): boolean {
    return Number(product.stock || 0) > 0;
  }

  onSearchChange(value: string): void {
    this.searchTerm = this.sanitizeSearch(value);
  }

  isProductActive(product: Product): boolean {
    return product.activo !== false;
  }

  canAddProduct(product: Product): boolean {
    return this.isProductActive(product) && this.hasStock(product);
  }

  formatBs(value: number | string): string {
    return `Bs. ${Number(value || 0).toFixed(2)}`;
  }

  trackByProduct(_index: number, product: Product): number {
    return product.id;
  }

  trackByCartItem(_index: number, item: CartItem): number {
    return item.product_id;
  }

  saveSale(): void {
    const userId = this.getSessionUserId();
    if (!userId) {
      alert('No se encontro la sesion del usuario');
      return;
    }

    if (!this.cart.length) {
      alert('Agrega al menos un producto a la venta');
      return;
    }

    const validDetails = this.cart.map((item) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    }));

    const hasInvalidDetail = validDetails.some(
      (detail) => !detail.product_id || detail.quantity <= 0 || detail.unit_price < 0
    );

    if (hasInvalidDetail) {
      alert('Revisa los detalles de la venta');
      return;
    }

    this.saving.set(true);
    this.service.basePost('salescontroller/save', {
      sale_date: new Date().toISOString(),
      is_active: true,
      user_id: userId,
      details: validDetails,
    }).subscribe({
      next: (sale: { id: number; total_amount: number | string; details: Array<{ quantity: number | string }> }) => {
        const total = Number(sale?.total_amount || 0);
        const items = Array.isArray(sale?.details)
          ? sale.details.reduce((sum, detail) => sum + Number(detail.quantity || 0), 0)
          : this.getCartItemsCount();

        const receiptData = {
          saleId: sale?.id || '',
          saleDate: new Date().toISOString(),
          userId,
          items: this.cart.map((item) => ({
            product_id: item.product_id,
            name: item.name,
            sku: item.sku || '',
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            line_total: this.getLineTotal(item),
          })),
          total_amount: total,
          total_items: items,
        };

        sessionStorage.setItem('lastSaleReceipt', JSON.stringify(receiptData));
        sessionStorage.setItem('lastSaleReceiptDownloaded', 'false');

        this.cart = [];
        this.searchTerm = '';
        this.saving.set(false);
        this.router.navigate(['/ventas/exito'], {
          queryParams: {
            saleId: sale?.id || '',
            total,
            items,
          }
        });
      },
      error: (err) => {
        console.error('Error al guardar venta:', err);
        const message = err?.error?.message || err?.message || 'Error al guardar la venta';
        alert(message);
        this.saving.set(false);
      }
    });
  }

  private sanitizeInteger(value: number | string, min = 0): number {
    const cleaned = String(value ?? '').replace(/[^\d-]/g, '');
    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed)) return min;
    return Math.min(MAX_SALE_QUANTITY, Math.max(min, Math.trunc(parsed)));
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

  private normalizeProducts(data: Product[] | { data?: Product[] } | null | undefined): Product[] {
    const rows = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : [];

    return rows
      .map((product) => ({
        id: Number(product.id),
        name: product.name || '',
        price: Number(product.price || 0),
        stock: Number(product.stock || 0),
        sku: product.sku || '',
        activo: product.activo !== false,
      }))
      .filter((product) => product.activo !== false);
  }

  private getSessionUserId(): number | null {
    const sessionData = this.session.get();
    if (!sessionData) return null;

    try {
      const user = JSON.parse(sessionData);
      return Number(user.id) || null;
    } catch {
      return null;
    }
  }
}
