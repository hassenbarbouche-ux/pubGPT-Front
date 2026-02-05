import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Réponse de l'API de découverte des colonnes
 */
export interface ColumnDiscoveryResponse {
  success: boolean;
  errorMessage?: string;
  question?: string;
  detectedIntent?: string;
  tables?: TableWithColumns[];
}

/**
 * Table avec ses colonnes
 */
export interface TableWithColumns {
  tableName: string;
  tableDescription?: string;
  columns: ColumnInfo[];
}

/**
 * Information sur une colonne
 */
export interface ColumnInfo {
  id: string;           // Format: TABLE.COLUMN
  columnName: string;
  dataType: string;
  description?: string;
  notNull: boolean;
}

/**
 * Requête pour la découverte des colonnes
 */
export interface ColumnDiscoveryRequest {
  question: string;
  userId?: number;
  sessionId?: string;
}

/**
 * Service pour la découverte des tables et colonnes pertinentes
 */
@Injectable({
  providedIn: 'root'
})
export class ColumnDiscoveryService {
  private readonly API_URL = '/api/v1/columns';

  constructor(private http: HttpClient) {}

  /**
   * Découvre les tables et colonnes pertinentes pour une question
   *
   * @param request Requête contenant la question
   * @returns Observable avec les tables et colonnes découvertes
   */
  discoverColumns(request: ColumnDiscoveryRequest): Observable<ColumnDiscoveryResponse> {
    return this.http.post<ColumnDiscoveryResponse>(`${this.API_URL}/discover`, request);
  }

  /**
   * Health check du service de découverte
   */
  healthCheck(): Observable<string> {
    return this.http.get(`${this.API_URL}/health`, { responseType: 'text' });
  }
}
