import { describe, expect, it } from "vitest";
import { PrivateDocumentLifecycleSerialGate } from "../../../functions/api/private-document-lifecycle-serialization";

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("PrivateDocumentLifecycleSerialGate", () => {
  it("serializes overlapping operations for one lifecycle instance", async () => {
    const gate = new PrivateDocumentLifecycleSerialGate();
    const firstRelease = deferred<void>();
    const events: string[] = [];

    const first = gate.run(async () => {
      events.push("first:start");
      await firstRelease.promise;
      events.push("first:end");
      return 1;
    });
    const second = gate.run(async () => {
      events.push("second:start");
      return 2;
    });

    await flushMicrotasks();
    expect(events).toEqual(["first:start"]);

    firstRelease.resolve();
    await expect(first).resolves.toBe(1);
    await expect(second).resolves.toBe(2);
    expect(events).toEqual(["first:start", "first:end", "second:start"]);
  });

  it("releases the queue after a failed operation", async () => {
    const gate = new PrivateDocumentLifecycleSerialGate();
    const firstRelease = deferred<void>();
    const events: string[] = [];

    const first = gate.run(async () => {
      events.push("first:start");
      await firstRelease.promise;
      throw new Error("synthetic failure");
    });
    const second = gate.run(async () => {
      events.push("second:start");
      return "recovered";
    });

    await flushMicrotasks();
    expect(events).toEqual(["first:start"]);
    firstRelease.resolve();

    await expect(first).rejects.toThrow("synthetic failure");
    await expect(second).resolves.toBe("recovered");
    expect(events).toEqual(["first:start", "second:start"]);
  });

  it("does not globally serialize different lifecycle instances", async () => {
    const firstGate = new PrivateDocumentLifecycleSerialGate();
    const secondGate = new PrivateDocumentLifecycleSerialGate();
    const firstRelease = deferred<void>();
    const events: string[] = [];

    const first = firstGate.run(async () => {
      events.push("first:start");
      await firstRelease.promise;
      return "first";
    });
    const second = secondGate.run(async () => {
      events.push("second:start");
      return "second";
    });

    await flushMicrotasks();
    expect(events).toEqual(["first:start", "second:start"]);
    await expect(second).resolves.toBe("second");

    firstRelease.resolve();
    await expect(first).resolves.toBe("first");
  });
});
