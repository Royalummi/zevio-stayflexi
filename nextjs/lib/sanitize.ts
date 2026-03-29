import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML string to prevent XSS attacks.
 * Uses DOMPurify to strip dangerous tags/attributes while preserving safe HTML.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html);
}
