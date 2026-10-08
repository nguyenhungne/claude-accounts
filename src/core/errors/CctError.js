export class CctError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CctError';
  }
}
