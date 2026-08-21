export class EmailPackageError extends Error {
  constructor(message: string, public readonly statusCode: number = 422) {
    super(message);
    this.name = "EmailPackageError";
  }
}
