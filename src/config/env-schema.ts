import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  NEXT_PUBLIC_SITE_URL: z.url({ protocol: /^https?$/ }),

  /** Signs session cookies and tokens. At least 32 random characters; never reuse across sites. */
  BETTER_AUTH_SECRET: z.string().min(32),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  /** Sender shown on emails, e.g. `BizConnect Rwanda <no-reply@example.rw>`. */
  MAIL_FROM: z.string().min(3),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables. Compare your .env file with .env.example.\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
