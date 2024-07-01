class ApiResonse {
  constructor(statusCode, message = "Success", data) {
    super(message);
    this.statusCode = statusCode,
      this.message = message,
      this.success = statusCode < 400,
      this.data = data
  }
}

export { ApiResonse }