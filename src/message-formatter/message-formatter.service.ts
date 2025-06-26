export class MessageFormatterService {
  format(message: string): string {
    const date = new Date().toISOString();
    return `[${date}] ${message}`;
  }
}
