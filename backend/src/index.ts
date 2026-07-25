import cors from "@fastify/cors";
import Fastify from "fastify";
import { env } from "@env";

async function bootstrap() {
    const app = Fastify({ logger: true });

    await app.register(cors, { origin: "*" });

    app.get("/health", async (_req, _res) => {
        return { message: "UP!" };
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