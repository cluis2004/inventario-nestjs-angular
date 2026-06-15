import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SessionService } from '../../service/session.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html'
})
export class SidebarComponent implements OnInit {
  userName = 'Usuario';
  userEmail = '';

  constructor(
    private readonly session: SessionService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const sessionData = this.session.get();
    if (!sessionData) return;

    try {
      const user = JSON.parse(sessionData);
      this.userName = user?.name || 'Usuario';
      this.userEmail = user?.email || '';
    } catch {
      this.userName = 'Usuario';
      this.userEmail = '';
    }
  }

  logout(): void {
    this.session.delete();
    this.router.navigate(['/login']);
  }
}
