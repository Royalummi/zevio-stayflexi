import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * @param {string} dirty - Untrusted HTML string
 * @param {object} options - DOMPurify configuration options
 * @returns {string} - Sanitized HTML string
 *
 * @example
 * const clean = sanitizeHTML('<script>alert("xss")</script><p>Safe content</p>');
 * // Returns: '<p>Safe content</p>'
 */
export const sanitizeHTML = (dirty, options = {}) => {
  if (!dirty || typeof dirty !== "string") {
    return "";
  }

  const defaultConfig = {
    ALLOWED_TAGS: [
      "p",
      "br",
      "b",
      "i",
      "u",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "span",
      "div",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "id"],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  };

  const config = { ...defaultConfig, ...options };
  return DOMPurify.sanitize(dirty, config);
};

/**
 * Sanitize an object containing HTML fields
 *
 * @param {object} obj - Object with potentially unsafe HTML fields
 * @param {string[]} fields - Array of field names to sanitize
 * @returns {object} - Object with sanitized fields
 *
 * @example
 * const clean = sanitizeObject(
 *   { description: '<script>alert("xss")</script>', title: 'Safe' },
 *   ['description']
 * );
 */
export const sanitizeObject = (obj, fields) => {
  const sanitized = { ...obj };

  fields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = sanitizeHTML(sanitized[field]);
    }
  });

  return sanitized;
};

/**
 * Validate and sanitize rich text (for CKEditor/TinyMCE content)
 * Allows more HTML tags but still prevents XSS
 */
export const sanitizeRichText = (dirty) => {
  return sanitizeHTML(dirty, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "b",
      "i",
      "u",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "span",
      "div",
      "blockquote",
      "pre",
      "code",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "td",
      "th",
    ],
    ALLOWED_ATTR: [
      "href",
      "target",
      "rel",
      "class",
      "id",
      "src",
      "alt",
      "title",
      "width",
      "height",
      "style",
    ],
    ALLOWED_STYLES: ["color", "background-color", "font-size", "text-align"],
  });
};

export default {
  sanitizeHTML,
  sanitizeObject,
  sanitizeRichText,
};
