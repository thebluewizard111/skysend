type EnvMode = "public" | "server";

type EnvShape = {
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: string;
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: string;
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: string;
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  NEXT_PUBLIC_MAP_PROVIDER: string;
  NEXT_PUBLIC_GEOAPIFY_API_KEY?: string;
  NEXT_PUBLIC_MAP_PUBLIC_TOKEN?: string;
  NEXT_PUBLIC_MAP_TILE_URL?: string;
  NEXT_PUBLIC_MAP_GEOCODING_URL?: string;
  CLERK_SECRET_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  MAP_PROVIDER_SECRET_KEY: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  OPENAI_API_KEY?: string;
};

const publicEnvKeys = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
  "NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_MAP_PROVIDER",
] as const satisfies readonly (keyof EnvShape)[];

const optionalPublicEnvKeys = [
  "NEXT_PUBLIC_GEOAPIFY_API_KEY",
  "NEXT_PUBLIC_MAP_PUBLIC_TOKEN",
  "NEXT_PUBLIC_MAP_TILE_URL",
  "NEXT_PUBLIC_MAP_GEOCODING_URL",
] as const satisfies readonly (keyof EnvShape)[];

const serverEnvKeys = [
  "CLERK_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "MAP_PROVIDER_SECRET_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
] as const satisfies readonly (keyof EnvShape)[];

const optionalServerEnvKeys = [
  "OPENAI_API_KEY",
] as const satisfies readonly (keyof EnvShape)[];

function readEnvValue(key: keyof EnvShape, mode: EnvMode) {
  const value = process.env[key];

  if (!value || value.trim().length === 0) {
    throw new Error(`[env] Missing required ${mode} environment variable: ${key}`);
  }

  return value;
}

function readOptionalEnvValue(key: keyof EnvShape) {
  const value = process.env[key];

  if (!value || value.trim().length === 0) {
    return undefined;
  }

  return value;
}

function pickEnv<const Keys extends readonly (keyof EnvShape)[]>(
  keys: Keys,
  mode: EnvMode,
) {
  return Object.fromEntries(
    keys.map((key) => [key, readEnvValue(key, mode)]),
  ) as { [Key in Keys[number]]: EnvShape[Key] };
}

function pickOptionalEnv<const Keys extends readonly (keyof EnvShape)[]>(keys: Keys) {
  return Object.fromEntries(
    keys.map((key) => [key, readOptionalEnvValue(key)]),
  ) as { [Key in Keys[number]]: EnvShape[Key] | undefined };
}

export const publicEnv = {
  ...pickEnv(publicEnvKeys, "public"),
  ...pickOptionalEnv(optionalPublicEnvKeys),
} as const;

export function getServerEnv() {
  return {
    ...pickEnv(serverEnvKeys, "server"),
    ...pickOptionalEnv(optionalServerEnvKeys),
  };
}

export const envKeys = {
  public: publicEnvKeys,
  publicOptional: optionalPublicEnvKeys,
  server: serverEnvKeys,
  serverOptional: optionalServerEnvKeys,
} as const;
