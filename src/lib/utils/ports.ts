import { Logger } from 'lib/utils/logging/logger';
import { cast, Guard } from 'lib/utils/typeGuard';

export type Port<T> = {
  port: number;
  guard: Guard<unknown, T>;
};

const NO_DATA = 'NULL PORT DATA';

export class PortHandle<T> {
  private constructor(
    private ns: NS,
    private port: Port<T>,
    private handle: NetscriptPort,
    private log: Logger | undefined,
  ) {}

  public static connectToPort<T>(ns: NS, port: Port<T>, log?: Logger): PortHandle<T> {
    return new PortHandle(ns, port, ns.getPortHandle(port.port), log);
  }

  public read(): T | undefined {
    const data: unknown = this.handle.read();

    if (data === NO_DATA) {
      this.log?.trace('found no data. returning undefined', ['data', data]);
      return;
    }

    this.log?.trace('casting data to expected type', ['data', data]);

    return cast(data, this.port.guard);
  }

  public async awaitRead(): Promise<T> {
    while (true) {
      const data = this.read();

      if (data !== undefined) {
        return data;
      }

      await this.ns.sleep(50);
    }
  }

  public write(data: T): boolean {
    return this.handle.tryWrite(data);
  }

  public getPort(): number {
    return this.port.port;
  }

  public async awaitWrite(data: T) {
    while (true) {
      if (this.write(data)) {
        return;
      }

      await this.ns.sleep(1_000);
    }
  }

  public clearPort() {
    this.handle.clear();
  }

  public hasData(): boolean {
    return !this.handle.empty();
  }
}
