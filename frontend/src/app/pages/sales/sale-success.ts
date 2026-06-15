import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReceiptItem {
  product_id: number;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface SaleReceipt {
  saleId: string | number;
  saleDate: string;
  userId: number | string;
  items: ReceiptItem[];
  total_amount: number;
  total_items: number;
}

@Component({
  selector: 'app-sale-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sale-success.html'
})
export class SaleSuccess implements OnInit {
  saleId = signal('');
  total = signal(0);
  items = signal(0);
  receiptAvailable = signal(false);

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.saleId.set(params.get('saleId') || '');
      this.total.set(Number(params.get('total') || 0));
      this.items.set(Number(params.get('items') || 0));
      this.receiptAvailable.set(!!sessionStorage.getItem('lastSaleReceipt'));
    });
  }

  downloadReceipt(): void {
    const stored = sessionStorage.getItem('lastSaleReceipt');
    if (!stored) {
      alert('No se encontró el recibo para descargar.');
      return;
    }

    let receipt: SaleReceipt;
    try {
      receipt = JSON.parse(stored) as SaleReceipt;
    } catch {
      alert('No se pudo leer el recibo.');
      return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const title = 'Recibo de Venta';
    doc.setFontSize(16);
    doc.text(title, 40, 50);
    doc.setFontSize(11);
    const headerY = 80;

    doc.text(`Nro. venta: ${receipt.saleId}`, 40, headerY);
    doc.text(`Fecha: ${new Date(receipt.saleDate).toLocaleString()}`, 40, headerY + 16);
    doc.text(`Total unidades: ${receipt.total_items}`, 40, headerY + 32);
    doc.text(`Total: ${this.formatBs(receipt.total_amount)}`, 40, headerY + 48);

    autoTable(doc, {
      startY: 120,
      head: [['#', 'Producto', 'SKU', 'Cant.', 'Precio', 'Subtotal']],
      body: receipt.items.map((item, index) => [
        String(index + 1),
        item.name,
        item.sku || '-',
        String(item.quantity),
        this.formatBs(item.unit_price),
        this.formatBs(item.line_total),
      ]),
      headStyles: { fillColor: [22, 163, 74], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 6 },
      columnStyles: { 0: { cellWidth: 30 }, 3: { halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'right' } }
    });

    const tableFinalY = (doc as any).lastAutoTable?.finalY || 140;
    doc.text(`Total final: ${this.formatBs(receipt.total_amount)}`, 40, tableFinalY + 30);
    doc.save(`recibo-venta-${receipt.saleId}.pdf`);

    sessionStorage.setItem('lastSaleReceiptDownloaded', 'true');
  }

  formatBs(value: number | string): string {
    return `Bs. ${Number(value || 0).toFixed(2)}`;
  }
}
