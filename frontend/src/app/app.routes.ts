import { Routes } from '@angular/router';
import { Login } from './pages/auth/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { authGuard } from './service/auth.guard';

import { Home } from './pages/home/home';
import { Products } from './pages/products/products';
import { Sales } from './pages/sales/sales';
import { SalesList } from './pages/sales/sales-list';
import { SaleSuccess } from './pages/sales/sale-success';
import { StockEntryRegister } from './pages/stock-entries/stock-entry-register';
import { StockEntriesList } from './pages/stock-entries/stock-entries-list';

export const routes: Routes = [
  { path: 'login', component: Login },
  { 
    path: '', 
    component: Dashboard, 
    canActivate: [authGuard],
    children: [
      { path: 'inicio', component: Home },
      { path: 'productos', component: Products },
      { path: 'ventas', component: SalesList },
      { path: 'ventas/registrar', component: Sales },
      { path: 'ventas/exito', component: SaleSuccess },
      { path: 'entradas', component: StockEntriesList },
      { path: 'entradas/registrar', component: StockEntryRegister },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];


