import { EmailController } from "./modules/emails/presentation/EmailController";
import { SendEmail } from "./modules/emails/application/useCases/SendEmail";
import { NodemailerAdapter } from "./infra/adapters/email/Nodemailer";
import type { IncomingMessage, ServerResponse } from "http";
import { env } from "./infra/config/env";
import cors from "@fastify/cors";
import Fastify from "fastify";

const app = Fastify({ logger: true });

async function init() {
  await app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  });

  const emailAdapter = new NodemailerAdapter();
  const sendEmailUseCase = new SendEmail(emailAdapter);
  const emailController = new EmailController(sendEmailUseCase);

  app.get("/health", async (_req, _res) => {
    return { message: "UP!" };
  });

  app.post("/api/send-email", async (req, res) => {
    return await emailController.handle(req, res);
  });
}

const initPromise = init();

// Rodar localmente com app.listen se não estiver no ambiente da Vercel
if (!env.infra.vercel) {
  initPromise.then(() => {
    app.listen({ port: env.infra.port, host: env.infra.host }).then(() => {
      console.log(`Server running on port ${env.infra.port}`);
    }).catch((err) => {
      app.log.error(err);
      process.exit(1);
    });
  });
}

// Handler Serverless exportado para a Vercel com tipagem estrita
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await initPromise;
  await app.ready();
  app.server.emit("request", req, res);
}