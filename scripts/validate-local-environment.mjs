const forbiddenCredentialVariables = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_PASSWORD",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
];

const present = forbiddenCredentialVariables.filter((name) => {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
});

if (present.length > 0) {
  console.error(
    `Lot 0 verification must not receive production-capable credentials: ${present.join(", ")}`,
  );
  process.exit(1);
}

console.log("Local/CI environment validation passed without production credentials.");
