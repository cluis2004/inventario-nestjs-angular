import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-container">
      <h1>Bienvenido a Inventa</h1>
      <p>Selecciona una opción en el menú lateral para comenzar.</p>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 2rem;
      color: var(--text);
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: var(--primary);
    }
  `]
})
export class Home {}
