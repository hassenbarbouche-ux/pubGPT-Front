/**
 * Utilitaire pour exporter des données JSON en CSV
 */
export class CsvExportUtil {

  /**
   * Convertit un tableau d'objets JSON en format CSV
   * @param data - Tableau d'objets à convertir
   * @param filename - Nom du fichier CSV (par défaut: 'export.csv')
   */
  static exportToCsv(data: Record<string, any>[], filename: string = 'export.csv'): void {
    if (!data || data.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }

    const csv = this.convertJsonToCsv(data);
    this.downloadCsv(csv, filename);
  }

  /**
   * Convertit un tableau JSON en chaîne CSV
   */
  private static convertJsonToCsv(data: Record<string, any>[]): string {
    // Extraire les en-têtes (clés du premier objet)
    const headers = Object.keys(data[0]);

    // Créer la ligne d'en-tête
    const headerLine = headers.map(header => this.escapeCsvValue(header)).join(',');

    // Créer les lignes de données
    const dataLines = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        return this.escapeCsvValue(value);
      }).join(',');
    });

    // Combiner en-tête et données
    return [headerLine, ...dataLines].join('\n');
  }

  /**
   * Échappe les valeurs CSV (gère les virgules, guillemets, retours à la ligne)
   */
  private static escapeCsvValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Convertir en string
    let stringValue = String(value);

    // Si la valeur contient une virgule, un guillemet ou un retour à la ligne,
    // l'entourer de guillemets et échapper les guillemets internes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      stringValue = '"' + stringValue.replace(/"/g, '""') + '"';
    }

    return stringValue;
  }

  /**
   * Déclenche le téléchargement du CSV
   */
  private static downloadCsv(csv: string, filename: string): void {
    // Créer un Blob avec le contenu CSV (UTF-8 avec BOM pour Excel)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });

    // Créer un lien de téléchargement
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Libérer l'URL
    URL.revokeObjectURL(url);
  }
}
