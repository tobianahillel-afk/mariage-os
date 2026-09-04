import { afterEach, beforeEach, expect, it, vi } from "vitest";

const startApplication = vi.hoisted(() => vi.fn());
const createBrowserShellRuntime = vi.hoisted(() => vi.fn());
vi.mock("@app/bootstrap/start-application", () => ({ startApplication }));
vi.mock("@app/bootstrap/browser-shell-runtime", () => ({
  createBrowserShellRuntime,
}));

beforeEach(() => {
  vi.resetModules();
  startApplication.mockReset();
  startApplication.mockResolvedValue(undefined);
  createBrowserShellRuntime.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it("composes the browser shell with the provider-backed runtime", async () => {
  const root = {} as HTMLElement;
  const sessionReader = { getSession: vi.fn() };
  const projectAccess = { canReadProject: vi.fn() };
  createBrowserShellRuntime.mockReturnValue({ sessionReader, projectAccess });
  vi.stubGlobal("document", { querySelector: () => root });
  vi.stubGlobal("window", { location: { pathname: "/rsvp/example" } });

  await import("./main");

  expect(createBrowserShellRuntime).toHaveBeenCalledTimes(1);
  expect(startApplication).toHaveBeenCalledWith(root, {
    pathname: "/rsvp/example",
    sessionReader,
    projectAccess,
  });
});

it("fails fast before provider composition when the application root is missing", async () => {
  vi.stubGlobal("document", { querySelector: () => null });

  await expect(import("./main")).rejects.toThrow(
    "Mariage OS bootstrap root #app is missing.",
  );
  expect(createBrowserShellRuntime).not.toHaveBeenCalled();
  expect(startApplication).not.toHaveBeenCalled();
});
