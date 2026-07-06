import { describe, it, expect } from 'vitest';
import { fmtDate, urgencyBadge, today, monthStart } from '../../pages/reports/reportCatalog';

describe('reportCatalog helpers', () => {
  describe('fmtDate', () => {
    it('formats ISO date string to DD-MM-YYYY', () => {
      expect(fmtDate('2025-03-15T00:00:00')).toBe('15-03-2025');
    });

    it('returns — for null', () => {
      expect(fmtDate(null)).toBe('—');
    });

    it('returns — for undefined', () => {
      expect(fmtDate(undefined)).toBe('—');
    });

    it('pads single-digit day and month', () => {
      expect(fmtDate('2025-01-05T00:00:00')).toBe('05-01-2025');
    });
  });

  describe('urgencyBadge', () => {
    it('returns red classes for EXPIRED', () => {
      expect(urgencyBadge('EXPIRED')).toContain('red-100');
    });

    it('returns amber classes for WARNING', () => {
      expect(urgencyBadge('WARNING')).toContain('amber');
    });

    it('returns blue classes for EARLY_ALERT', () => {
      expect(urgencyBadge('EARLY_ALERT')).toContain('blue');
    });

    it('returns slate fallback for unknown urgency', () => {
      expect(urgencyBadge('UNKNOWN_VALUE')).toContain('slate-100');
    });
  });

  describe('date constants', () => {
    it('today is in YYYY-MM-DD format', () => {
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('monthStart is the first day of the current month', () => {
      const [year, month] = monthStart.split('-');
      expect(monthStart).toMatch(/^\d{4}-\d{2}-01$/);
    });
  });
});
