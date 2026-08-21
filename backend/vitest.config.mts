import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      INFRA_PORT: "3000",
      INFRA_HOST: "127.0.0.1",
      EMAIL_HOST: "smtp.example.com",
      EMAIL_PORT: "587",
      EMAIL_USER: "test@example.com",
      EMAIL_PASSWORD: "test-app-password",
    },
  },
});
