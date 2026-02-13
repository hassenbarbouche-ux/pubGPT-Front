import { Injectable } from '@angular/core';
import { GLOSSARY } from '../data/glossary';

@Injectable({ providedIn: 'root' })
export class GlossaryService {

  /** Glossary terms sorted longest-first for greedy matching */
  private readonly terms: string[];

  constructor() {
    this.terms = [...GLOSSARY].sort((a, b) => b.length - a.length);
  }

  /**
   * Returns HTML where glossary matches are wrapped in <strong>.
   * Matches are case-insensitive and accent-insensitive.
   * Handles French singular/plural (e.g. "campagnes" matches "campagne").
   */
  buildHighlightedHtml(text: string): string {
    if (!text) return '';

    const normalized = this.normalize(text);
    // Track which character positions are already matched
    const matched = new Array(text.length).fill(false);
    const highlights: { start: number; end: number }[] = [];

    // For each glossary term, find all occurrences in the normalized text
    for (const term of this.terms) {
      const normTerm = this.normalize(term);
      let searchFrom = 0;

      while (searchFrom < normalized.length) {
        const idx = normalized.indexOf(normTerm, searchFrom);
        if (idx === -1) break;

        const end = idx + normTerm.length;

        // Check word boundaries: must be at start/end of string or adjacent to non-alpha
        const beforeOk = idx === 0 || !this.isAlpha(normalized[idx - 1]);
        const afterOk = end >= normalized.length || !this.isAlpha(normalized[end]);

        // Also check if the user wrote a plural form (extra 's' or 'x' after the match)
        const afterPluralOk = end < normalized.length
          && (normalized[end] === 's' || normalized[end] === 'x')
          && (end + 1 >= normalized.length || !this.isAlpha(normalized[end + 1]));

        if (beforeOk && (afterOk || afterPluralOk)) {
          const actualEnd = afterPluralOk && !afterOk ? end + 1 : end;

          // Check no overlap with already matched positions
          let overlaps = false;
          for (let i = idx; i < actualEnd; i++) {
            if (matched[i]) { overlaps = true; break; }
          }

          if (!overlaps) {
            for (let i = idx; i < actualEnd; i++) matched[i] = true;
            highlights.push({ start: idx, end: actualEnd });
          }
        }

        searchFrom = idx + 1;
      }
    }

    if (highlights.length === 0) return this.escapeHtml(text);

    // Sort highlights by position
    highlights.sort((a, b) => a.start - b.start);

    // Build HTML
    let html = '';
    let cursor = 0;
    for (const h of highlights) {
      if (h.start > cursor) {
        html += this.escapeHtml(text.substring(cursor, h.start));
      }
      html += '<strong>' + this.escapeHtml(text.substring(h.start, h.end)) + '</strong>';
      cursor = h.end;
    }
    if (cursor < text.length) {
      html += this.escapeHtml(text.substring(cursor));
    }

    return html;
  }

  /** Normalize: lowercase, strip accents */
  private normalize(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private isAlpha(ch: string): boolean {
    const c = ch.charCodeAt(0);
    return (c >= 97 && c <= 122) || (c >= 65 && c <= 90); // a-z, A-Z
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
