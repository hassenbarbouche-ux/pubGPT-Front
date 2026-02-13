import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, startWith, switchMap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenStats } from '../models/token-stats.model';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly API_URL = `${environment.apiUrl}/tokens`;

  constructor(private http: HttpClient) {}

  /**
   * Get token usage statistics for a user
   * @param userId User ID
   * @returns TokenStats observable
   */
  getUserTokenStats(userId: number): Observable<TokenStats> {
    return this.http.get<TokenStats>(`${this.API_URL}/user/${userId}`);
  }

  /**
   * Poll token stats every 30 seconds for a user
   * @param userId User ID
   * @param intervalMs Polling interval in milliseconds (default: 30000)
   * @returns TokenStats observable that emits periodically
   */
  pollUserTokenStats(userId: number, intervalMs: number = 30000): Observable<TokenStats> {
    return interval(intervalMs).pipe(
      startWith(0), // Emit immediately
      switchMap(() => this.getUserTokenStats(userId)),
      catchError(error => {
        console.error('Error fetching token stats:', error);
        // Return default stats on error
        return of({
          idUser: userId,
          totalTokensConsumed: 0,
          maxTokensAllowed: 50000,
          remainingTokens: 50000,
          usagePercentage: 0,
          quotaExceeded: false
        });
      })
    );
  }
}
