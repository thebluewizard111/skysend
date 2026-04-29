import "server-only";

type RequiredServerEnvKey =
  | "CLERK_SECRET_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "STRIPE_SECRET_KEY"
  | "STRIPE_WEBHOOK_SECRET"
  | "MAP_PROVIDER_SECRET_KEY"
  | "RESEND_API_KEY"
  | "RESEND_FROM_EMAIL";

type OptionalServerEnvKey = "OPENAI_API_KEY";

function readRequiredServerEnv(key: RequiredServerEnvKey) {
  const value = process.env[key];

  if (!value || value.trim().length === 0) {
    throw new Error(`[env] Missing required server environment variable: ${key}`);
  }

  return value;
}

function readOptionalServerEnv(key: OptionalServerEnvKey) {
  const value = process.env[key];

  return value && value.trim().length > 0 ? value : undefined;
}

export const serverEnv = {
  CLERK_SECRET_KEY: readRequiredServerEnv("CLERK_SECRET_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: readRequiredServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
  STRIPE_SECRET_KEY: readRequiredServerEnv("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: readRequiredServerEnv("STRIPE_WEBHOOK_SECRET"),
  MAP_PROVIDER_SECRET_KEY: readRequiredServerEnv("MAP_PROVIDER_SECRET_KEY"),
  RESEND_API_KEY: readRequiredServerEnv("RESEND_API_KEY"),
  RESEND_FROM_EMAIL: readRequiredServerEnv("RESEND_FROM_EMAIL"),
  OPENAI_API_KEY: readOptionalServerEnv("OPENAI_API_KEY"),
} as const;
