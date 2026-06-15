import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

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

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.saleId.set(params.get('saleId') || '');
      this.total.set(Number(params.get('total') || 0));
      this.items.set(Number(params.get('items') || 0));
    });
  }

  formatBs(value: number | string): string {
    return `Bs. ${Number(value || 0).toFixed(2)}`;
  }
}
