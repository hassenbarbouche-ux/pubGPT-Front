import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, switchMap } from 'rxjs';
import { LoginRequest, LoginResponse, DemoLoginRequest, DemoLoginResponse, User } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly DEMO_API_URL = 'https://agxzf3svr5.execute-api.us-east-1.amazonaws.com';
  private readonly STORAGE_KEY = 'pubgpt_user';

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  public shouldShowTour = false;

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
   * Authentifie un utilisateur demo via email + code.
   * 1. Vérifie le code via Lambda AWS
   * 2. Enregistre/récupère le user en base via le backend (pour avoir un vrai ID)
   */
  demoLogin(request: DemoLoginRequest): Observable<DemoLoginResponse> {
    return this.http.post<DemoLoginResponse>(`${this.DEMO_API_URL}/demo-verify`, request).pipe(
      switchMap(lambdaResponse => {
        if (!lambdaResponse.valid) {
          return new Observable<DemoLoginResponse>(observer => {
            observer.next(lambdaResponse);
            observer.complete();
          });
        }

        // Code valide → enregistrer/récupérer le user en base
        return this.http.post<LoginResponse>(`${this.API_URL}/demo-register`, {
          email: lambdaResponse.email
        }).pipe(
          tap(backendResponse => {
            if (backendResponse.success && backendResponse.user) {
              const bu = backendResponse.user;
              const demoUser: User = {
                id: bu.id,
                login: bu.login,
                isActive: true,
                dateCreation: new Date(),
                dateModification: new Date(),
                isDemo: true,
                tokenQuota: bu.tokenQuota ?? 0,
                tokensUsed: bu.tokensUsed ?? 0,
                tokensRemaining: bu.tokensRemaining ?? 0
              };
              this.saveUserToStorage(demoUser);
              this.currentUserSubject.next(demoUser);
              this.shouldShowTour = true;
            }
          }),
          // Remap vers DemoLoginResponse pour que le composant login garde le même contrat
          switchMap(() => new Observable<DemoLoginResponse>(observer => {
            observer.next(lambdaResponse);
            observer.complete();
          }))
        );
      })
    );
  }

  /**
   * Vérifie si l'utilisateur courant est un utilisateur demo
   */
  public isDemoUser(): boolean {
    return this.currentUserValue?.isDemo === true;
  }

  /**
   * Retourne les infos de quota tokens de l'utilisateur demo
   */
  public getTokenQuota(): { tokenQuota: number; tokensUsed: number; tokensRemaining: number } | null {
    const user = this.currentUserValue;
    if (!user?.isDemo || !user.tokenQuota) return null;
    return {
      tokenQuota: user.tokenQuota,
      tokensUsed: user.tokensUsed ?? 0,
      tokensRemaining: user.tokensRemaining ?? 0
    };
  }

  /**
   * Rafraîchit le quota tokens depuis le backend
   */
  refreshQuota(): void {
    const user = this.currentUserValue;
    if (!user || user.id <= 0) return;

    this.http.get<User>(`${this.API_URL}/quota/${user.id}`).subscribe({
      next: (updatedUser) => {
        const merged: User = {
          ...user,
          tokensUsed: updatedUser.tokensUsed,
          tokensRemaining: updatedUser.tokensRemaining,
          tokenQuota: updatedUser.tokenQuota
        };
        this.saveUserToStorage(merged);
        this.currentUserSubject.next(merged);
      },
      error: (err) => console.error('Erreur rafraîchissement quota:', err)
    });
  }

  /**
   * Déconnecte l'utilisateur
   */
  logout(): void {
    this.removeUserFromStorage();
    this.shouldShowTour = false;
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
