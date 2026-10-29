/**
 * Only allow redirects to paths inside this site (blocks open-redirect attacks
 * like ?redirect=https://evil.com or ?redirect=//evil.com).
 */
export function safeRedirectPath(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback;
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//') || value.includes('\\')) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
