import { execFileSync } from "node:child_process";

const files = [
  "src/application/documents/private-document-service.coverage.test.ts",
  "src/infrastructure/supabase/parse-private-document-receipt.coverage.test.ts",
  "src/infrastructure/supabase/parse-private-document-receipt-links.coverage.test.ts",
  "src/infrastructure/supabase/supabase-private-document-lifecycle-adapter.coverage.test.ts",
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
