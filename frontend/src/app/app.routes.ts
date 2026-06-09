import { Routes } from '@angular/router';
import { Login } from './pages/auth/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { authGuard } from './service/auth.guard';

import { Home } from './pages/home/home';
import { Products } from './pages/products/products';

export const routes: Routes = [
  { path: 'login', component: Login },
  { 
    path: '', 
    component: Dashboard, 
    canActivate: [authGuard],
    children: [
      { path: 'inicio', component: Home },
      { path: 'productos', component: Products },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];


