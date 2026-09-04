import { beforeEach, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

const officialCreateClient = vi.hoisted(() => vi.fn());
vi.mock("@supabase/supabase-js", () => ({ createClient: officialCreateClient }));

import {
  createBrowserShellRuntime,
  readBrowserSupabaseConfig,
  type BrowserSupabaseEnvironment,
} from "./browser-shell-runtime";

const projectId = "81111111-1111-4111-8111-111111111111";
const publishableKey = "sb_publishable_synthetic-browser-key";

function fakeClient(): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn(),
      },
    },
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  } as unknown as SupabaseClient;
}

beforeEach(() => {
  officialCreateClient.mockReset();
});

it("accepts HTTPS and normalizes whitespace/origin", () => {
  expect(
    readBrowserSupabaseConfig({
      VITE_SUPABASE_URL: " https://project.example/ ",
      VITE_SUPABASE_PUBLISHABLE_KEY: ` ${publishableKey} `,
    }),
  ).toEqual({
    url: "https://project.example",
    publishableKey,
  });
});

it.each([
  "http://localhost:54321/",
  "http://127.0.0.1:54321/",
])("accepts local HTTP origin %s", (url) => {
  expect(
    readBrowserSupabaseConfig({
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    }),
  ).toEqual({
    url: url.slice(0, -1),
    publishableKey,
  });
});

const invalidBrowserConfigs: BrowserSupabaseEnvironment[] = [
  {},
  { VITE_SUPABASE_URL: "https://project.example/" },
  { VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey },
  {
    VITE_SUPABASE_URL: "   ",
    VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  },
  {
    VITE_SUPABASE_URL: "https://project.example/",
    VITE_SUPABASE_PUBLISHABLE_KEY: "   ",
  },
  {
    VITE_SUPABASE_URL: "https://project.example/",
    VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_not-for-browser",
  },
  {
    VITE_SUPABASE_URL: "https://project.example/",
    VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_",
  },
  {
    VITE_SUPABASE_URL: "not-a-url",
    VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  },
  {
    VITE_SUPABASE_URL: "http://remote.example/",
    VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  },
  {
    VITE_SUPABASE_URL: "ftp://localhost/",
    VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  },
  {
    VITE_SUPABASE_URL: "https://project.example/rest/v1",
    VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  },
  {
    VITE_SUPABASE_URL: "https://project.example/?query=1",
    VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  },
  {
    VITE_SUPABASE_URL: "https://project.example/#fragment",
    VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  },
  {
    VITE_SUPABASE_URL: "https://user:pass@project.example/",
    VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  },
  {
    VITE_SUPABASE_URL: "https://:pass@project.example/",
    VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  },
];

it.each(invalidBrowserConfigs)("rejects invalid browser config %#", (environment) => {
  expect(readBrowserSupabaseConfig(environment)).toBeNull();
});

it("composes accepted adapters around the official client", async () => {
  const client = fakeClient();
  officialCreateClient.mockReturnValue(client);

  const runtime = createBrowserShellRuntime({
    VITE_SUPABASE_URL: "https://project.example/",
    VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  });
  const access = runtime.projectAccess;
  if (access === null) throw new Error("Expected project access adapter.");

  expect(officialCreateClient).toHaveBeenCalledWith(
    "https://project.example",
    publishableKey,
  );
  await expect(runtime.sessionReader.getSession()).resolves.toEqual({
    kind: "signed_out",
  });
  await expect(access.canReadProject(projectId)).resolves.toBe(true);
});

it("fails closed when browser config is absent", async () => {
  const runtime = createBrowserShellRuntime({});

  expect(officialCreateClient).not.toHaveBeenCalled();
  expect(runtime.projectAccess).toBeNull();
  await expect(runtime.sessionReader.getSession()).resolves.toEqual({
    kind: "signed_out",
  });
});

it("fails closed when client construction throws", async () => {
  const factory = vi.fn().mockImplementation(() => {
    throw new Error("client construction failed");
  });
  const runtime = createBrowserShellRuntime(
    {
      VITE_SUPABASE_URL: "https://project.example/",
      VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    },
    factory,
  );

  expect(runtime.projectAccess).toBeNull();
  await expect(runtime.sessionReader.getSession()).resolves.toEqual({
    kind: "signed_out",
  });
});
