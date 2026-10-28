export const ERROR_MESSAGES = Object.freeze({
  // General & Server
  INTERNAL_SERVER_ERROR: "An unexpected internal server error occurred.",
  INVALID_REQUEST: "Invalid request payload or parameters.",
  RESOURCE_NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Request validation failed.",
  SERVER_PORT_IS_MISSING: "Server port is missing",
  DB_URL_IS_MISSING: "Database url is missing in env file",
  DATABASE_CONNECTION_ERROR: "Database connection error",
  REDIS_CONNECTION_FAILED: "Redis connection error",

  // Authentication & Authorization
  UNAUTHORIZED: "Authentication required. Please provide a valid token.",
  VERIFY_EMAIL: "Verify your email to access resources",
  FORBIDDEN: "Access denied. You do not have sufficient permissions.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  EMAIL_ALREADY_EXISTS: "A user with this email already exists.",
  TOKEN_EXPIRED: "Token has expired. Please log in again.",
  TOKEN_INVALID: "Token is invalid or malformed.",
  USER_NOT_FOUND: "User does not exist.",
  INVALID_OBJECT_ID: "Object Id is invalid",
  AUTH_LIMIT: "Too many authentication attempts. Please try again later.",
  VALIDATION_FAILED: "validation failed",
  ACCOUNT_INACTIVE: "Your account has Inactive by admin",

  OTP_EXPIRED: "Otp expired or invalid",
  OTP_INVALID: "Invalid Otp",
  PRODUCT_OWNERSHIP_REQUIRED: "You are not authorized to modify this product.",
  CLOUDINARY_BULK_DELETE_FAILED:
    "Failed to delete product images from Cloudinary.",
  CLOUDINARY_BULK_DELETE_LIMIT:
    "Cannot delete more than 100 product images at once.",
  CLOUDINARY_DELETE_FAILED: "Failed to delete product image from Cloudinary.",

  //Cart
  CART_QUANTITY_EXCEED: "Maximum quantity is 25.",
  LOW_STOCK: "Low stock",
  PRODUCT_NOT_FOUND: "Product not found or unavailable",
  CART_ITEM_NOT_FOUND: "Cart not found",
  EMPTY_CART: "Empty Cart",
  SELLER_NOT_FOUND: "Seller not found.",
  ORDER_ITEM_NOT_FOUND: "Order item not found",
  INVALID_ITEM_TRANSITION: "Invalid item status transition.",
  UNSUPPORT_PAYMENT_METHOD: "Unsupported payment method.",
  ORDER_NOT_UPDATED: "Order item status could not be updated."
})
