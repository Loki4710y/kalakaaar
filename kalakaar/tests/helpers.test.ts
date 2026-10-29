import { describe, it, expect } from 'vitest';
import { safeRedirectPath } from '../src/lib/safeRedirect';
import { normalizeWhatsapp, whatsappLink } from '../src/lib/contact';
import { sanitizeHtml } from '../src/lib/sanitize';
import { isUuid, sanitizeSearch, clampLimit, slugify, cleanUrl, cleanImageUrls, categoryVariants } from '../src/repositories/utils';

describe('safeRedirectPath (open-redirect protection)', () => {
  it('allows normal in-site paths', () => {
    expect(safeRedirectPath('/artist-portal')).toBe('/artist-portal');
    expect(safeRedirectPath('/explore?x=1')).toBe('/explore?x=1');
  });
  it('blocks external and tricky redirects', () => {
    for (const bad of ['https://evil.com', '//evil.com', '/\\evil.com', 'javascript:alert(1)', '/a\nb']) {
      expect(safeRedirectPath(bad, '/home')).toBe('/home');
    }
    expect(safeRedirectPath(null, '/x')).toBe('/x');
  });
});

describe('WhatsApp links', () => {
  it('adds 91 to bare 10-digit numbers and keeps full numbers', () => {
    expect(normalizeWhatsapp('98765 43210')).toBe('919876543210');
    expect(normalizeWhatsapp('+91 98765-43210')).toBe('919876543210');
    expect(normalizeWhatsapp('+1 415 555 2671')).toBe('14155552671');
  });
  it('rejects unusable numbers', () => {
    expect(normalizeWhatsapp('123')).toBeNull();
    expect(normalizeWhatsapp('')).toBeNull();
    expect(whatsappLink(undefined, 'hi')).toBeNull();
  });
  it('builds an encoded wa.me link', () => {
    expect(whatsappLink('9876543210', 'Hi & bye')).toBe('https://wa.me/919876543210?text=Hi%20%26%20bye');
  });
});

describe('sanitizeHtml (story content)', () => {
  it('removes scripts, event handlers and javascript links', () => {
    const out = sanitizeHtml('<p onclick="x()">Hi</p><script>alert(1)</script><a href="javascript:alert(1)">l</a><img src=x onerror=alert(1)>');
    expect(out).not.toMatch(/script|onclick|onerror|javascript:|<img/i);
    expect(out).toContain('Hi');
  });
  it('keeps normal formatting', () => {
    expect(sanitizeHtml('<h2>T</h2><p><b>bold</b></p>')).toBe('<h2>T</h2><p><b>bold</b></p>');
  });
});

describe('repository helpers', () => {
  it('isUuid', () => {
    expect(isUuid('3f2b8c1e-5d4a-4e6f-9a1b-2c3d4e5f6a7b')).toBe(true);
    expect(isUuid('art-1')).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });
  it('sanitizeSearch strips filter-breaking characters', () => {
    const out = sanitizeSearch('a,b%(c)*"d\\');
    expect(out).not.toMatch(/[%,()*"\\]/);
    expect(sanitizeSearch('x'.repeat(300)).length).toBeLessThanOrEqual(80);
  });
  it('clampLimit', () => {
    expect(clampLimit(1000, 24, 60)).toBe(60);
    expect(clampLimit(-5, 24, 60)).toBe(1);
    expect(clampLimit(undefined, 24, 60)).toBe(24);
  });
  it('slugify always matches the database slug rule', () => {
    const rule = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const t of ['Royal Elephant Painting', 'कला', '   ', 'Café — Ñandú!!', '😀😀']) {
      const s = slugify(t);
      expect(s).toMatch(rule);
      expect(s.length).toBeLessThanOrEqual(160);
    }
  });
  it('cleanUrl / cleanImageUrls only keep safe URLs', () => {
    expect(cleanUrl('javascript:alert(1)')).toBeNull();
    expect(cleanUrl('https://a.com/x')).toBe('https://a.com/x');
    expect(cleanImageUrls(['https://a.com/1.jpg', 'data:image/png;base64,AAA', 'blob:x', '/assets/defaults/artwork.svg', 5]))
      .toEqual(['https://a.com/1.jpg', '/assets/defaults/artwork.svg']);
  });
});

describe('categoryVariants (index-friendly category filter)', () => {
  it('returns the spellings to match', () => {
    expect(categoryVariants('warli')).toEqual(expect.arrayContaining(['warli', 'Warli', 'WARLI']));
    expect(categoryVariants('pattachitra art')).toContain('Pattachitra Art');
  });
  it('strips characters that could break the filter', () => {
    expect(categoryVariants('a,b)(c')).not.toContain('a,b)(c');
    expect(categoryVariants('   ')).toEqual([]);
  });
});
