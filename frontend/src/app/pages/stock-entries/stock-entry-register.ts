import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BasicService } from '../../service/basic.service';
import { SessionService } from '../../service/session.service';

interface Product {
  id: number;
  name: string;
  stock: number | string;
  sku?: string;
  activo?: boolean;
}

interface EntryRow {
  product_id: number;
  product_name: string;
  product_sku?: string;
  stock: number;
  quantity: number;
}

const MAX_ENTRY_QUANTITY = 999999;

@Component({
  selector: 'app-stock-entry-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './stock-entry-register.html'
})
export class StockEntryRegister implements OnInit {
  products = signal<Product[]>([]);
  loading = signal(false);
  saving = signal(false);
  searchTerm = '';

  details: EntryRow[] = [];

  @ViewChild('productSearchInput') productSearchInput?: ElementRef<HTMLInputElement>;
  @ViewChildren('quantityInput') quantityInputs?: QueryList<ElementRef<HTMLInputElement>>;

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
        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];

        this.products.set(
          rows
            .map((product) => ({
              id: Number(product.id),
              name: product.name || '',
              stock: Number(product.stock || 0),
              sku: product.sku || '',
              activo: product.activo !== false,
            }))
            .filter((product) => product.activo !== false)
        );
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.loading.set(false);
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm = this.sanitizeSearch(value);
  }

  getFilteredProducts(): Product[] {
    const tokens = this.getSearchTokens(this.searchTerm);
    const selectedIds = new Set(this.details.map((detail) => detail.product_id));

    const availableProducts = this.products().filter((product) => !selectedIds.has(product.id));
    if (!tokens.length) return availableProducts;

    return availableProducts.filter((product) => {
      const haystack = this.normalizeSearch(`${product.name} ${product.sku || ''} ${product.id}`);
      return tokens.every((token) => haystack.includes(token));
    });
  }

  hasSearchResults(): boolean {
    return this.getFilteredProducts().length > 0;
  }

  addProduct(product: Product): void {
    const existingIndex = this.details.findIndex((detail) => detail.product_id === product.id);
    if (existingIndex >= 0) {
      this.focusQuantityInput(existingIndex);
      return;
    }

    this.details = [
      ...this.details,
      {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku || '',
        stock: Number(product.stock || 0),
        quantity: 1,
      }
    ];

    this.searchTerm = '';
    this.focusQuantityInput(this.details.length - 1);
  }

  clearRow(index: number): void {
    this.details = this.details.filter((_, currentIndex) => currentIndex !== index);
    this.focusSearchInput();
  }

  getRowsWithValues(): number {
    return this.details.filter((detail) => detail.quantity > 0).length;
  }

  getTotalUnits(): number {
    return this.details.reduce((sum, detail) => sum + (detail.product_id ? Number(detail.quantity || 0) : 0), 0);
  }

  getCurrentStock(productId: number | null): number {
    if (!productId) return 0;
    const product = this.products().find((item) => item.id === Number(productId));
    return Number(product?.stock || 0);
  }

  updateRowQuantity(index: number, value: number | string): void {
    const detail = this.details[index];
    if (!detail) return;

    detail.quantity = Math.max(1, this.sanitizeInteger(value));
    this.details = [...this.details];
  }

  saveEntry(): void {
    const userId = this.getSessionUserId();
    if (!userId) {
      alert('No se encontro la sesion del usuario');
      return;
    }

    const normalizedDetails = this.details.map((detail) => ({
      ...detail,
      quantity: Math.max(1, this.sanitizeInteger(detail.quantity)),
    }));

    this.details = normalizedDetails;

    const validDetails = normalizedDetails
      .filter((detail) => detail.product_id && Number(detail.quantity) > 0)
      .map((detail) => ({
        product_id: Number(detail.product_id),
        quantity: Number(detail.quantity),
      }));

    if (!validDetails.length) {
      alert('Debes registrar al menos una fila valida');
      return;
    }

    this.saving.set(true);
    this.service.basePost('stockentrycontroller/save', {
      user_id: userId,
      entry_date: new Date().toISOString(),
      status: 'registered',
      details: validDetails,
    }).subscribe({
      next: () => {
        alert('Entrada registrada correctamente');
        this.router.navigate(['/entradas']);
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Error al guardar entrada:', err);
        const message = err?.error?.message || err?.message || 'Error al guardar la entrada';
        alert(message);
        this.saving.set(false);
      }
    });
  }

  getProductLabel(product: Product): string {
    return `${product.id} - ${product.name}${product.sku ? ` - ${product.sku}` : ''}`;
  }

  trackByProduct(_index: number, product: Product): number {
    return product.id;
  }

  trackByRow(_index: number, detail: EntryRow): number {
    return detail.product_id;
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

  private sanitizeInteger(value: number | string): number {
    const cleaned = String(value ?? '').replace(/[^\d-]/g, '');
    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed)) return 0;
    return Math.min(MAX_ENTRY_QUANTITY, Math.max(0, Math.trunc(parsed)));
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

  private focusQuantityInput(index: number): void {
    setTimeout(() => {
      const input = this.quantityInputs?.get(index)?.nativeElement;
      input?.focus();
      input?.select();
    });
  }

  private focusSearchInput(): void {
    setTimeout(() => {
      this.productSearchInput?.nativeElement.focus();
    });
  }
}
