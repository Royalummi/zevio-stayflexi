/**
 * Pagination Middleware
 * Validates and sanitizes pagination parameters (page, limit)
 * to prevent DOS attacks and invalid inputs
 */

// Default pagination values
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100; // Prevent excessive data fetches
const MIN_LIMIT = 1;

/**
 * Validate and sanitize pagination query parameters
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 *
 * @example
 * router.get('/items', validatePagination, getItems);
 */
export const validatePagination = (req, res, next) => {
  // Parse page parameter
  let page = parseInt(req.query.page) || DEFAULT_PAGE;
  if (isNaN(page) || page < 1) {
    page = DEFAULT_PAGE;
  }

  // Parse limit parameter
  let limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
  if (isNaN(limit) || limit < MIN_LIMIT) {
    limit = DEFAULT_LIMIT;
  }
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  // Attach sanitized values to request
  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit,
  };

  next();
};

/**
 * Custom pagination validator with different limits
 *
 * @param {object} options - Pagination options
 * @param {number} options.maxLimit - Maximum items per page
 * @param {number} options.defaultLimit - Default items per page
 *
 * @example
 * router.get('/users', customPagination({ maxLimit: 50 }), getUsers);
 */
export const customPagination = (options = {}) => {
  const maxLimit = options.maxLimit || MAX_LIMIT;
  const defaultLimit = options.defaultLimit || DEFAULT_LIMIT;

  return (req, res, next) => {
    let page = parseInt(req.query.page) || DEFAULT_PAGE;
    if (isNaN(page) || page < 1) {
      page = DEFAULT_PAGE;
    }

    let limit = parseInt(req.query.limit) || defaultLimit;
    if (isNaN(limit) || limit < MIN_LIMIT) {
      limit = defaultLimit;
    }
    if (limit > maxLimit) {
      limit = maxLimit;
    }

    req.pagination = {
      page,
      limit,
      offset: (page - 1) * limit,
    };

    next();
  };
};

/**
 * Generate pagination metadata for response
 *
 * @param {number} total - Total count of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} Pagination metadata
 *
 * @example
 * const meta = getPaginationMeta(150, 2, 20);
 * // Returns: { total: 150, page: 2, limit: 20, totalPages: 8, hasNext: true, hasPrev: true }
 */
export const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

export default {
  validatePagination,
  customPagination,
  getPaginationMeta,
};
