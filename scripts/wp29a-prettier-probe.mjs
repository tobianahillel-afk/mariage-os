import { execFileSync } from "node:child_process";

const files = [
  "src/application/documents/private-document-lifecycle-port.ts",
  "src/application/documents/private-document-service.test.ts",
  "src/application/documents/private-document-service.ts",
  "src/application/documents/private-document-storage-port.ts",
  "src/domain/documents/venue-private-document.test.ts",
  "src/domain/documents/venue-private-document.ts",
  "src/infrastructure/supabase/parse-private-document-receipt.ts",
  "src/infrastructure/supabase/supabase-private-document-lifecycle-adapter.test.ts",
  "src/infrastructure/supabase/supabase-private-document-lifecycle-adapter.ts",
];

execFileSync("node_modules/.bin/prettier", ["--write", ...files], {
  stdio: "inherit",
});

const patch = execFileSync("git", ["diff", "--", ...files], {
  encoding: "utf8",
});

console.log("WP29A_PRETTIER_PATCH_BEGIN");
console.log(patch);
console.log("WP29A_PRETTIER_PATCH_END");
