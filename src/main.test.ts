import { afterEach, beforeEach, expect, it, vi } from "vitest";

const startApplication = vi.hoisted(() => vi.fn());
vi.mock("@app/bootstrap/start-application", () => ({ startApplication }));

beforeEach(() => {
  vi.resetModules();
  startApplication.mockReset();
  startApplication.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it("composes the browser shell as signed out until provider runtime exists", async () => {
  const root = {} as HTMLElement;
  vi.stubGlobal("document", { querySelector: () => root });
  vi.stubGlobal("window", { location: { pathname: "/rsvp/example" } });

  await import("./main");

  expect(startApplication).toHaveBeenCalledTimes(1);
  const [receivedRoot, dependencies] = startApplication.mock.calls[0] ?? [];
  expect(receivedRoot).toBe(root);
  expect(dependencies).toMatchObject({
    pathname: "/rsvp/example",
    projectAccess: null,
  });
  await expect(dependencies.sessionReader.getSession()).resolves.toEqual({
    kind: "signed_out",
  });
});

it("fails fast when the application root is missing", async () => {
  vi.stubGlobal("document", { querySelector: () => null });

  await expect(import("./main")).rejects.toThrow(
    "Mariage OS bootstrap root #app is missing.",
  );
  expect(startApplication).not.toHaveBeenCalled();
});
