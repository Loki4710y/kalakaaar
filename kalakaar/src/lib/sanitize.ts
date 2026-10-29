import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = ['p', 'br', 'h2', 'h3', 'h4', 'blockquote', 'ul', 'ol', 'li', 'b', 'strong', 'i', 'em', 'u', 'a', 'hr', 'span'];

/** Cleans story HTML so a malicious author cannot run scripts in a reader's browser. */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i,
  });
}
