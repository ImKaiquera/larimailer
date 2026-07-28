import { EmailController } from "./modules/emails/presentation/EmailController";
import { SendEmail } from "./modules/emails/application/useCases/SendEmail";
import { NodemailerAdapter } from "./infra/adapters/email/Nodemailer";
import { env } from "./infra/config/env";
import cors from "@fastify/cors";
import Fastify from "fastify";

async function bootstrap() {
    const app = Fastify({ logger: true });
    await app.register(cors, { origin: "*" });

    const emailAdapter = new NodemailerAdapter();
    const sendEmailUseCase = new SendEmail(emailAdapter);
    const emailController = new EmailController(sendEmailUseCase);

    app.get("/health", async (_req, _res) => {
        return { message: "UP!" };
    });

    app.post("/api/send-email", async (req, res) => {
        return await emailController.handle(req, res);
    });

    try {
        await app.listen({ port: env.infra.port, host: env.infra.host });
        console.log(`Server running on port ${env.infra.port}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    };
};

bootstrap();