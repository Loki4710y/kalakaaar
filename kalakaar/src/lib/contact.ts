/** Digits only; a bare 10-digit Indian mobile gets the 91 prefix. Returns null if unusable. */
export function normalizeWhatsapp(input?: string | null): string | null {
  const digits = (input || "").replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return digits.length === 10 ? `91${digits}` : digits;
}

/** Builds a wa.me link, or null when the artist has no (valid) number. */
export function whatsappLink(number?: string | null, message?: string): string | null {
  const n = normalizeWhatsapp(number);
  if (!n) return null;
  return `https://wa.me/${n}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
