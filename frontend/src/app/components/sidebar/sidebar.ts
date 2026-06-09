import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <ul class="sidebar-menu">
        <li>
          <a routerLink="/inicio" routerLinkActive="active" class="menu-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <span>Inicio</span>
          </a>
        </li>
        <li>
          <a routerLink="/productos" routerLinkActive="active" class="menu-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
            <span>Productos</span>
          </a>
        </li>
      </ul>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      background: #ffffff;
      border-right: 1px solid #e2e8f0;
      padding: 32px 0;
      height: calc(100vh - 73px);
      position: sticky;
      top: 73px;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    .sidebar-menu {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 28px;
      color: #64748b;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      transition: all 0.2s ease;
      border-left: 4px solid transparent;
    }

    .menu-item:hover {
      background: #f8fafc;
      color: #0f172a;
    }

    .menu-item.active {
      background: #f0fdf4;
      color: #049f6c;
      border-left-color: #049f6c;
    }

    .menu-item svg {
      width: 20px;
      height: 20px;
      transition: transform 0.2s ease;
    }

    .menu-item:hover svg {
      transform: translateX(2px);
    }
  `]
})
export class SidebarComponent {}
