import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
  VITE_APP_ID: z.string().min(1, "VITE_APP_ID is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  OAUTH_SERVER_URL: z.string().url("OAUTH_SERVER_URL must be a valid URL"),
  OWNER_OPEN_ID: z.string().min(1, "OWNER_OPEN_ID is required"),
  BUILT_IN_FORGE_API_URL: z.string().url("BUILT_IN_FORGE_API_URL must be a valid URL"),
  BUILT_IN_FORGE_API_KEY: z.string().min(1, "BUILT_IN_FORGE_API_KEY is required"),
});

const parsed = envSchema.safeParse(process.env);
const isTest = process.env.NODE_ENV === "test";
if (!parsed.success && !isTest) {
  const issues = parsed.error.issues.map(issue => `- ${issue.path.join(".")}: ${issue.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

const env = parsed.success
  ? parsed.data
  : {
      NODE_ENV: "test" as const,
      VITE_APP_ID: "test-app-id",
      JWT_SECRET: "test-secret-123456789012345678901234",
      DATABASE_URL: "mysql://test:test@localhost:3306/test",
      OAUTH_SERVER_URL: "https://oauth.test.local",
      OWNER_OPEN_ID: "owner-test",
      BUILT_IN_FORGE_API_URL: "https://forge.test.local",
      BUILT_IN_FORGE_API_KEY: "test-key",
    };

export const ENV = {
  appId: env.VITE_APP_ID,
  cookieSecret: env.JWT_SECRET,
  databaseUrl: env.DATABASE_URL,
  oAuthServerUrl: env.OAUTH_SERVER_URL,
  ownerOpenId: env.OWNER_OPEN_ID,
  isProduction: env.NODE_ENV === "production",
  forgeApiUrl: env.BUILT_IN_FORGE_API_URL,
  forgeApiKey: env.BUILT_IN_FORGE_API_KEY,
};
