import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { BasicService } from '../../service/basic.service';
import { SessionService } from '../../service/session.service';
import { SidebarComponent } from '../../components/sidebar/sidebar';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, SidebarComponent],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
    userName = 'Usuario';

    constructor(
        private readonly session: SessionService,
        private readonly router: Router
    ) {}

    ngOnInit(): void {
        const sessionData = this.session.get();
        if (sessionData) {
            try {
                const user = JSON.parse(sessionData);
                this.userName = user.name || 'Usuario';
            } catch (e) {
                this.userName = 'Usuario';
            }
        }
    }


    logout(): void {
        this.session.delete();
        this.router.navigate(['/login']);
    }
}
