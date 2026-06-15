import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BasicService } from '../../service/basic.service';

interface EntryUser {
  id: number;
  name: string;
  email: string;
}

interface EntryProduct {
  id: number;
  name: string;
  stock: number | string;
}

interface StockEntryDetail {
  id: number;
  product_id: number;
  quantity: number | string;
  product?: EntryProduct;
}

interface StockEntry {
  id: number;
  user_id: number;
  entry_date: string;
  status: 'registered' | 'cancelled';
  user?: EntryUser;
  details: StockEntryDetail[];
  created_at: string;
}

@Component({
  selector: 'app-stock-entries-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './stock-entries-list.html'
})
export class StockEntriesList implements OnInit {
  entries = signal<StockEntry[]>([]);
  loading = signal(false);
  selectedEntry = signal<StockEntry | null>(null);
  fromDate = '';
  toDate = '';
  statusFilter: 'registered' | 'cancelled' | 'all' = 'registered';
  appliedFromDate = '';
  appliedToDate = '';
  appliedStatusFilter: 'registered' | 'cancelled' | 'all' = 'registered';

  constructor(private readonly service: BasicService) {}

  ngOnInit(): void {
    this.loadEntries();
  }

  loadEntries(): void {
    this.loading.set(true);
    this.service.basePost('stockentrycontroller/getall', {}).subscribe({
      next: (data: StockEntry[]) => {
        this.entries.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar entradas:', err);
        this.loading.set(false);
      }
    });
  }

  cancelEntry(entry: StockEntry): void {
    if (entry.status === 'cancelled') return;
    if (!confirm(`¿Anular la entrada #${entry.id}? La entrada seguirá en el historial.`)) return;

    this.loading.set(true);
    this.service.basePost(`stockentrycontroller/delete/${entry.id}`, {}).subscribe({
      next: () => {
        this.loadEntries();
        alert('Entrada anulada');
      },
      error: (err) => {
        console.error('Error al anular entrada:', err);
        const message = err?.error?.message || err?.message || 'Error al anular la entrada';
        alert(message);
        this.loading.set(false);
      }
    });
  }

  getTotalItems(entry: StockEntry): number {
    return entry.details.reduce((sum, detail) => sum + Number(detail.quantity || 0), 0);
  }

  openEntryDetail(entry: StockEntry): void {
    this.selectedEntry.set(entry);
  }

  closeEntryDetail(): void {
    this.selectedEntry.set(null);
  }

  getProductsSummary(entry: StockEntry): string {
    return entry.details
      .slice(0, 3)
      .map((detail) => detail.product?.name || `Producto ${detail.product_id}`)
      .join(', ');
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  applyFilters(): void {
    this.appliedFromDate = this.fromDate;
    this.appliedToDate = this.toDate;
    this.appliedStatusFilter = this.statusFilter;
  }

  getFilteredEntries(): StockEntry[] {
    return this.entries().filter((entry) => {
      if (this.appliedStatusFilter !== 'all' && entry.status !== this.appliedStatusFilter) {
        return false;
      }

      const entryDate = new Date(entry.entry_date);

      if (this.appliedFromDate) {
        const fromDate = new Date(`${this.appliedFromDate}T00:00:00`);
        if (entryDate < fromDate) return false;
      }

      if (this.appliedToDate) {
        const toDate = new Date(`${this.appliedToDate}T23:59:59.999`);
        if (entryDate > toDate) return false;
      }

      return true;
    });
  }
}
