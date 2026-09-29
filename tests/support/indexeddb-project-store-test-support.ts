import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import {
  createPendingMutationEnvelope,
  type PendingMutationEnvelope,
} from "@application/local-data/local-records";

export type Row = Record<string, unknown>;
type FailureMode =
  "none" | "open" | "request" | "transaction_error" | "transaction_abort";

export function missingFixture(): never {
  throw new Error("IndexedDB test fixture is missing.");
}

class FakeRequest<T> {
  result!: T;
  onupgradeneeded: (() => void) | null = null;
  onsuccess: (() => void) | null = null;
  onerror: (() => void) | null = null;
}

class FakeDatabase {
  readonly stores = new Map<
    string,
    { keyPath: string; rows: Map<string, Row> }
  >();
  closed = false;

  readonly objectStoreNames = {
    contains: (name: string): boolean => this.stores.has(name),
  };

  constructor(private readonly state: FakeFactoryState) {}

  createObjectStore(
    name: string,
    options: IDBObjectStoreParameters,
  ): IDBObjectStore {
    this.stores.set(name, {
      keyPath: String(options.keyPath),
      rows: new Map(),
    });
    return {} as IDBObjectStore;
  }

  transaction(storeNames: string | string[]): IDBTransaction {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    const stores = new Map(
      names.map((name) => [name, this.stores.get(name) ?? missingFixture()]),
    );
    return new FakeTransaction(stores, this.state) as unknown as IDBTransaction;
  }

  close(): void {
    this.closed = true;
  }
}

class FakeTransaction {
  oncomplete: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  private pendingRequests = 0;
  private failed = false;
  private completionScheduled = false;
  private readonly stagedMutations: Array<() => void> = [];

  constructor(
    private readonly stores: Map<
      string,
      { keyPath: string; rows: Map<string, Row> }
    >,
    private readonly state: FakeFactoryState,
  ) {}

  objectStore(name: string): IDBObjectStore {
    const store = this.stores.get(name) ?? missingFixture();
    return new FakeObjectStore(
      store,
      this,
      this.state,
    ) as unknown as IDBObjectStore;
  }

  startRequest(): void {
    this.pendingRequests += 1;
  }

  completeRequest(mutate?: () => void): void {
    if (mutate !== undefined) this.stagedMutations.push(mutate);
    this.pendingRequests -= 1;
    this.scheduleCompletion();
  }

  failRequest(): void {
    this.failed = true;
    this.stagedMutations.length = 0;
    this.pendingRequests -= 1;
    this.scheduleCompletion();
  }

  private finishFailureMode(mode: FailureMode): boolean {
    if (mode === "transaction_error") {
      this.onerror?.();
      return true;
    }
    if (mode === "transaction_abort") {
      this.onabort?.();
      return true;
    }
    return false;
  }

  private finish(): void {
    if (this.failed) {
      this.onabort?.();
      return;
    }
    if (this.finishFailureMode(this.state.consumeFailure())) return;
    for (const mutate of this.stagedMutations) mutate();
    this.oncomplete?.();
  }

  private scheduleCompletion(): void {
    if (this.pendingRequests !== 0 || this.completionScheduled) return;
    this.completionScheduled = true;
    queueMicrotask(() => this.finish());
  }
}

class FakeObjectStore {
  constructor(
    private readonly store: { keyPath: string; rows: Map<string, Row> },
    private readonly transaction: FakeTransaction,
    private readonly state: FakeFactoryState,
  ) {}

  private keyFor(value: Row): string {
    return String(value[this.store.keyPath]);
  }

  private request<T>(result: T, mutate?: () => void): IDBRequest<T> {
    const request = new FakeRequest<T>();
    this.transaction.startRequest();
    queueMicrotask(() => {
      if (this.state.failure === "request") {
        this.state.consumeFailure();
        request.onerror?.();
        this.transaction.failRequest();
        return;
      }
      request.result = result;
      request.onsuccess?.();
      this.transaction.completeRequest(mutate);
    });
    return request as unknown as IDBRequest<T>;
  }

  get(key: IDBValidKey): IDBRequest<unknown> {
    return this.request(
      this.store.rows.get(String(key)),
    ) as unknown as IDBRequest<unknown>;
  }

  getAll(): IDBRequest<unknown[]> {
    return this.request([...this.store.rows.values()]) as unknown as IDBRequest<
      unknown[]
    >;
  }

  put(value: unknown): IDBRequest<IDBValidKey> {
    const row = value as Row;
    const key = this.keyFor(row);
    return this.request<IDBValidKey>(key, () => this.store.rows.set(key, row));
  }

  add(value: unknown): IDBRequest<IDBValidKey> {
    const row = value as Row;
    const key = this.keyFor(row);
    if (this.store.rows.has(key)) {
      return this.requestFailure<IDBValidKey>();
    }
    return this.request<IDBValidKey>(key, () => this.store.rows.set(key, row));
  }

  delete(key: IDBValidKey): IDBRequest<undefined> {
    return this.request<undefined>(undefined, () => {
      this.store.rows.delete(String(key));
    });
  }

  private requestFailure<T>(): IDBRequest<T> {
    const request = new FakeRequest<T>();
    this.transaction.startRequest();
    queueMicrotask(() => {
      request.onerror?.();
      this.transaction.failRequest();
    });
    return request as unknown as IDBRequest<T>;
  }
}

class FakeFactoryState {
  failure: FailureMode = "none";

  consumeFailure(): FailureMode {
    const failure = this.failure;
    this.failure = "none";
    return failure;
  }
}

export class FakeFactory {
  readonly state = new FakeFactoryState();
  readonly databases = new Map<string, FakeDatabase>();
  forceUpgrade = false;

  open(name: string): IDBOpenDBRequest {
    const request = new FakeRequest<IDBDatabase>();
    queueMicrotask(() => {
      if (this.state.failure === "open") {
        this.state.consumeFailure();
        request.onerror?.();
        return;
      }
      const existing = this.databases.get(name);
      const database = existing ?? new FakeDatabase(this.state);
      this.databases.set(name, database);
      request.result = database as unknown as IDBDatabase;
      if (existing === undefined || this.forceUpgrade) {
        request.onupgradeneeded?.();
      }
      request.onsuccess?.();
    });
    return request as unknown as IDBOpenDBRequest;
  }

  rawDatabase(name: string): FakeDatabase {
    return this.databases.get(name) ?? missingFixture();
  }
}

export const userId = "11111111-1111-4111-8111-111111111111";
export const projectId = "22222222-2222-4222-8222-222222222222";
export const deviceId = "33333333-3333-4333-8333-333333333333";
export const entityId = "44444444-4444-4444-8444-444444444444";
export const operationId = "55555555-5555-4555-8555-555555555555";
export const missingOperationId = "59999999-9999-4999-8999-999999999999";
export const scope = createLocalProjectScope(userId, projectId, deviceId);
export const databaseName = `mariage-os:project:${userId}:${projectId}`;

export function createMutation(): PendingMutationEnvelope {
  return createPendingMutationEnvelope(scope, {
    operationId,
    entityType: "project_preferences",
    entityId,
    mutationType: "update_preferences",
    baseRevision: "rev-1",
    payload: { density: "compact" },
    createdAt: "2026-09-04T14:00:00.000Z",
    priorityClass: "metadata",
  });
}

export function rawStore(factory: FakeFactory, name: string): Map<string, Row> {
  const store = factory.rawDatabase(databaseName).stores.get(name);
  return (store ?? missingFixture()).rows;
}
