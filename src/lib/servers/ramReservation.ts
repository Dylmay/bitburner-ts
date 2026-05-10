export class RamReservation {
  private readonly reserved = new Map<string, number>();

  reserve(hostname: string, ram: number): void {
    this.reserved.set(hostname, (this.reserved.get(hostname) ?? 0) + ram);
  }

  reservedFor(hostname: string): number {
    return this.reserved.get(hostname) ?? 0;
  }
}
