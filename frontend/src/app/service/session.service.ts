import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})
export class SessionService {
    get() {
        return localStorage.getItem('session');
    }
    save(data: string) {
        localStorage.setItem('session', data);
    }
    delete() {
        localStorage.removeItem('session');
    }
}
