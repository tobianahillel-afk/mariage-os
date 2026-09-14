import { execFileSync } from "node:child_process";

const files = [
  "src/application/documents/private-document-read-service.coverage.test.ts",
  "src/application/documents/private-document-read-service.test.ts",
  "src/application/documents/private-document-read-service.ts",
  "src/infrastructure/supabase/parse-private-document-read-row.coverage.test.ts",
  "src/infrastructure/supabase/parse-private-document-read-row.test.ts",
  "src/infrastructure/supabase/supabase-private-document-read-adapter.coverage.test.ts",
  "src/infrastructure/supabase/supabase-private-document-read-adapter.test.ts",
  "src/infrastructure/supabase/supabase-private-document-read-adapter.ts",
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
