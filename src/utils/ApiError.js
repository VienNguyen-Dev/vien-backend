class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", stack = "", errors = [], success = false) {
    super(message);
    this.statusCode = statusCode,
      this.message = message,
      this.errors = errors,
      this.success = success,
      this.data = null
    if (stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }

}

export { ApiError }