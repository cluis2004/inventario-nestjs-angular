import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  template: `
    <div class="table-container">
      <div *ngIf="loading()" class="loader-box">
        <div class="spinner"></div>
        <p>Cargando productos...</p>
      </div>

      <table *ngIf="!loading() && products().length > 0" class="custom-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th class="text-right">Precio Venta</th>
            <th class="text-center">Stock</th>
            <th class="text-center">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of products()">
            <td class="font-mono">{{ p.sku || 'N/A' }}</td>
            <td class="font-bold">{{ p.name }}</td>
            <td class="text-muted">{{ p.description || '-' }}</td>
            <td class="text-right font-bold">{{ p.price | currency:'USD' }}</td>
            <td class="text-center">
              <span [class]="'stock-badge ' + (p.stock <= 5 ? 'critical' : 'normal')">
                {{ p.stock }}
              </span>
            </td>
            <td class="text-center">
              <span [class]="'status-badge ' + (p.activo !== false ? 'active' : 'inactive')">
                {{ p.activo !== false ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-container {
      background: white;
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .custom-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .custom-table th {
      padding: 16px;
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      font-size: 14px;
      border-bottom: 1px solid #e2e8f0;
    }

    .custom-table td {
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      font-size: 15px;
    }

    .custom-table tr:hover td {
      background: #fafafa;
    }

    .font-mono {
      font-family: monospace;
      font-size: 14px;
      color: #64748b;
    }

    .font-bold {
      font-weight: 600;
      color: #0f172a;
    }

    .text-muted {
      color: #94a3b8;
      font-size: 14px;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .stock-badge {
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
    }

    .stock-badge.normal {
      background: #f0fdf4;
      color: #16a34a;
    }

    .stock-badge.critical {
      background: #fef2f2;
      color: #ef4444;
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }

    .status-badge.active {
      background: #e6fcf5;
      color: #099268;
    }

    .status-badge.inactive {
      background: #f1f3f5;
      color: #868e96;
    }

    .loader-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      color: #64748b;
      gap: 16px;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 4px solid #f1f5f9;
      border-top-color: #049f6c;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class Products implements OnInit {
    products = signal<Product[]>([]);
    loading = signal(false);

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
            error: () => {
                this.loading.set(false);
            }
        });
    }
}
