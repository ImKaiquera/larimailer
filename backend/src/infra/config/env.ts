import dotenv from "dotenv";

dotenv.config();

const REQUIRED_ENV_VARIABLES = [
  "INFRA_PORT",
  "INFRA_HOST",
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_USER",
  "EMAIL_PASSWORD",
] as const;

type RequiredEnvVariable = typeof REQUIRED_ENV_VARIABLES[number];

const missingVariables = REQUIRED_ENV_VARIABLES.filter(
  (name) => !process.env[name]?.trim(),
);

if (missingVariables.length > 0) {
  throw new Error(
    `[ENV ERROR] Variáveis obrigatórias ausentes: ${missingVariables.join(", ")}.`,
  );
}

function requiredEnv(name: RequiredEnvVariable): string {
  return process.env[name]!.trim();
}

function requiredPort(name: "INFRA_PORT" | "EMAIL_PORT"): number {
  const rawValue = requiredEnv(name);
  const port = Number(rawValue);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`[ENV ERROR] ${name} deve ser uma porta válida entre 1 e 65535.`);
  }

  return port;
}

export const env = {
  infra: {
    port: requiredPort("INFRA_PORT"),
    host: requiredEnv("INFRA_HOST"),
    vercel: process.env.VERCEL,
  },
  email: {
    host: requiredEnv("EMAIL_HOST"),
    port: requiredPort("EMAIL_PORT"),
    auth: {
      user: requiredEnv("EMAIL_USER"),
      pass: requiredEnv("EMAIL_PASSWORD"),
    },
  },
} as const;
