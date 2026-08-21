import { EmailController } from "./modules/emails/presentation/EmailController";
import { SendEmail } from "./modules/emails/application/useCases/SendEmail";
import { NodemailerAdapter } from "./infra/adapters/email/Nodemailer";
import { ZIP_UPLOAD_MAX_SIZE, ZipEmailPackageAdapter } from "./infra/adapters/archive/ZipEmailPackage";
import { IEmailService } from "./modules/emails/application/interfaces/IEmailService";
import type { IncomingMessage, ServerResponse } from "http";
import { env } from "./infra/config/env";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import Fastify from "fastify";

export function buildApp(emailService: IEmailService = new NodemailerAdapter(), logger = true) {
  const app = Fastify({ logger });

  app.register(cors, { origin: "*" });
  app.register(multipart, {
    limits: {
      fields: 2,
      files: 1,
      fileSize: ZIP_UPLOAD_MAX_SIZE,
      parts: 3,
      fieldSize: 10 * 1024,
    },
  });

  const sendEmailUseCase = new SendEmail(emailService);
  const emailPackageService = new ZipEmailPackageAdapter();
  const emailController = new EmailController(sendEmailUseCase, emailPackageService);

  app.get("/health", async () => {
    return { message: "UP!" };
  });

  app.post("/api/send-email", async (req, res) => {
    return await emailController.handle(req, res);
  });

  return app;
}

const app = buildApp();

if (!env.infra.vercel && process.env.NODE_ENV !== "test") {
  app.listen({ port: env.infra.port, host: env.infra.host }).then(() => {
    console.log(`Server running on port ${env.infra.port}`);
  }).catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await app.ready();
  app.server.emit("request", req, res);
};
