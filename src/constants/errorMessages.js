export const ERROR_MESSAGES = Object.freeze({
  // General & Server
  INTERNAL_SERVER_ERROR: 'An unexpected internal server error occurred.',
  INVALID_REQUEST: 'Invalid request payload or parameters.',
  RESOURCE_NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Request validation failed.',

  // Authentication & Authorization
  UNAUTHORIZED: 'Authentication required. Please provide a valid token.',
  FORBIDDEN: 'Access denied. You do not have sufficient permissions.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_ALREADY_EXISTS: 'A user with this email already exists.',
  TOKEN_EXPIRED: 'Token has expired. Please log in again.',
  TOKEN_INVALID: 'Token is invalid or malformed.',
  USER_NOT_FOUND: 'User does not exist.',

  // Product Catalog
  PRODUCT_NOT_FOUND: 'Product not found.',
  PRODUCT_ALREADY_EXISTS: 'A product with this name/SKU already exists.',
  INVALID_PRODUCT_ID: 'Invalid product ID format.',

  // Category
  CATEGORY_NOT_FOUND: 'Category not found.',
  CATEGORY_ALREADY_EXISTS: 'Category already exists.',
  INVALID_CATEGORY_ID: 'Invalid category ID format.',
});
