import { afterEach, beforeEach, expect, it, vi } from "vitest";

const startApplication = vi.hoisted(() => vi.fn());
const createBrowserShellRuntime = vi.hoisted(() => vi.fn());
const createDefaultBrowserLocalRuntime = vi.hoisted(() => vi.fn());
vi.mock("@app/bootstrap/start-application", () => ({ startApplication }));
vi.mock("@app/bootstrap/browser-shell-runtime", () => ({
  createBrowserShellRuntime,
}));
vi.mock("@app/bootstrap/browser-local-runtime", () => ({
  createDefaultBrowserLocalRuntime,
}));

beforeEach(() => {
  vi.resetModules();
  startApplication.mockReset();
  startApplication.mockResolvedValue(undefined);
  createBrowserShellRuntime.mockReset();
  createDefaultBrowserLocalRuntime.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it("composes provider and local-durability browser runtimes", async () => {
  const root = {} as HTMLElement;
  const sessionReader = { getSession: vi.fn() };
  const projectAccess = { canReadProject: vi.fn() };
  const localStoreFactory = { open: vi.fn() };
  createBrowserShellRuntime.mockReturnValue({ sessionReader, projectAccess });
  createDefaultBrowserLocalRuntime.mockReturnValue({
    localStoreFactory,
    deviceId: "61111111-1111-4111-8111-111111111111",
    online: true,
    appVersion: "0.0.0",
  });
  vi.stubGlobal("document", { querySelector: () => root });
  vi.stubGlobal("window", { location: { pathname: "/rsvp/example" } });

  await import("./main");

  expect(createBrowserShellRuntime).toHaveBeenCalledTimes(1);
  expect(createDefaultBrowserLocalRuntime).toHaveBeenCalledWith("0.0.0");
  expect(startApplication).toHaveBeenCalledWith(root, {
    pathname: "/rsvp/example",
    sessionReader,
    projectAccess,
    localStoreFactory,
    deviceId: "61111111-1111-4111-8111-111111111111",
    online: true,
    appVersion: "0.0.0",
  });
});

it("fails fast before runtime composition when the application root is missing", async () => {
  vi.stubGlobal("document", { querySelector: () => null });

  await expect(import("./main")).rejects.toThrow(
    "Mariage OS bootstrap root #app is missing.",
  );
  expect(createBrowserShellRuntime).not.toHaveBeenCalled();
  expect(createDefaultBrowserLocalRuntime).not.toHaveBeenCalled();
  expect(startApplication).not.toHaveBeenCalled();
});
