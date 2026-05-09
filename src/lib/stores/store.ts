import * as files from 'lib/utils/files/files';
import { Path } from 'lib/utils/files/paths';
import { Guard } from 'lib/utils/typeGuard';

export type StoreDef<T extends object> = {
  location: Path;
  loadGuard: Guard<unknown, T>;
};

export class Store<T extends object> {
  private constructor(
    private ns: NS,
    private storeDef: StoreDef<T>,
  ) {}

  public static openStore<T extends object>(ns: NS, storeDef: StoreDef<T>) {
    return new Store(ns, storeDef);
  }

  public load(): T {
    return files.loadJson<T>(this.ns, this.storeDef.location, this.storeDef.loadGuard);
  }

  public tryLoad(): T | undefined {
    return files.tryLoadJson<T>(this.ns, this.storeDef.location, this.storeDef.loadGuard);
  }

  public write(data: T) {
    files.writeJson<T>(this.ns, this.storeDef.location, data);
  }
}
