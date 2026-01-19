import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/v1/auth';
  private readonly STORAGE_KEY = 'pubgpt_user';

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(private http: HttpClient) {
    // Charger l'utilisateur depuis le localStorage au démarrage
    const storedUser = this.loadUserFromStorage();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  /**
   * Récupère l'utilisateur actuellement connecté
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifie si un utilisateur est connecté
   */
  public isAuthenticated(): boolean {
    return this.currentUserValue !== null;
  }

  /**
   * Authentifie un utilisateur
   */
  login(loginRequest: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, loginRequest).pipe(
      tap(response => {
        if (response.success && response.user) {
          this.saveUserToStorage(response.user);
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  /**
   * Déconnecte l'utilisateur
   */
  logout(): void {
    this.removeUserFromStorage();
    this.currentUserSubject.next(null);
  }

  /**
   * Sauvegarde l'utilisateur dans le localStorage
   */
  private saveUserToStorage(user: User): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  /**
   * Charge l'utilisateur depuis le localStorage
   */
  private loadUserFromStorage(): User | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored) as User;
    } catch (e) {
      console.error('Erreur lors du parsing du user stocké:', e);
      return null;
    }
  }

  /**
   * Supprime l'utilisateur du localStorage
   */
  private removeUserFromStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
