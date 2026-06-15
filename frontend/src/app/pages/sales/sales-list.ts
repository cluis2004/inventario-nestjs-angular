import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BasicService } from '../../service/basic.service';

interface Product {
  id: number;
  name: string;
  price: number | string;
  stock: number | string;
  activo?: boolean;
}

interface SaleUser {
  id: number;
  name: string;
  email: string;
}

interface SaleDetail {
  id: number;
  product_id: number;
  quantity: number | string;
  unit_price: number | string;
  line_total: number | string;
  product?: Product;
}

interface Sale {
  id: number;
  sale_date: string;
  total_amount: number | string;
  is_active: boolean;
  user_id: number;
  user?: SaleUser;
  details: SaleDetail[];
}

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sales-list.html'
})
export class SalesList implements OnInit {
  sales = signal<Sale[]>([]);
  loading = signal(false);
  selectedSale = signal<Sale | null>(null);
  searchTerm = '';
  fromDate = '';
  toDate = '';
  appliedSearchTerm = '';
  appliedFromDate = '';
  appliedToDate = '';

  constructor(private readonly service: BasicService) {}

  ngOnInit(): void {
    this.loadSales();
  }

  loadSales(): void {
    this.loading.set(true);
    this.service.basePost('salescontroller/getall', {}).subscribe({
      next: (data: Sale[]) => {
        this.sales.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar ventas:', err);
        this.loading.set(false);
      }
    });
  }

  cancelSale(sale: Sale): void {
    if (!sale.is_active) return;
    if (!confirm(`¿Anular la venta #${sale.id}? La venta seguirá en el historial.`)) return;

    this.loading.set(true);
    this.service.basePost(`salescontroller/delete/${sale.id}`, {}).subscribe({
      next: () => {
        this.loadSales();
        alert('Venta anulada');
      },
      error: (err) => {
        console.error('Error al anular venta:', err);
        alert('Error al anular la venta');
        this.loading.set(false);
      }
    });
  }

  getSaleItemsCount(sale: Sale): number {
    return sale.details.reduce((sum, detail) => sum + Number(detail.quantity || 0), 0);
  }

  openSaleDetail(sale: Sale): void {
    this.selectedSale.set(sale);
  }

  closeSaleDetail(): void {
    this.selectedSale.set(null);
  }

  getProductsSummary(sale: Sale): string {
    return sale.details
      .slice(0, 3)
      .map((detail) => detail.product?.name || `Producto ${detail.product_id}`)
      .join(', ');
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  formatBs(value: number | string): string {
    return `Bs. ${Number(value || 0).toFixed(2)}`;
  }

  getLineTotal(detail: SaleDetail): number {
    if (detail.line_total !== undefined && detail.line_total !== null) {
      return Number(detail.line_total || 0);
    }

    return Number(detail.quantity || 0) * Number(detail.unit_price || 0);
  }

  onSearchChange(value: string): void {
    this.searchTerm = this.sanitizeSearch(value);
  }

  applyFilters(): void {
    this.appliedSearchTerm = this.searchTerm;
    this.appliedFromDate = this.fromDate;
    this.appliedToDate = this.toDate;
  }

  getFilteredSales(): Sale[] {
    const tokens = this.getSearchTokens(this.appliedSearchTerm);

    return this.sales().filter((sale) => {
      if (this.appliedFromDate) {
        const fromDate = new Date(`${this.appliedFromDate}T00:00:00`);
        if (new Date(sale.sale_date) < fromDate) return false;
      }

      if (this.appliedToDate) {
        const toDate = new Date(`${this.appliedToDate}T23:59:59.999`);
        if (new Date(sale.sale_date) > toDate) return false;
      }

      if (!tokens.length) return true;

      const detailsSummary = sale.details
        .map((detail) => `${detail.product?.name || ''} ${detail.product_id || ''}`)
        .join(' ');

      const haystack = this.normalizeSearch(
        `${sale.id} ${sale.user?.name || ''} ${sale.user?.email || ''} ${detailsSummary}`
      );

      return tokens.every((token) => haystack.includes(token));
    });
  }

  private sanitizeSearch(value: string): string {
    return (value || '')
      .replace(/[^\p{L}\p{N}\s.@_\-\/]/gu, '')
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
}
