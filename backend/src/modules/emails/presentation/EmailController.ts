import { SendEmail, SendEmailDTO } from "../application/useCases/SendEmail";
import { FastifyRequest, FastifyReply } from "fastify";

export class EmailController {
    constructor(private readonly sendEmailUseCase: SendEmail) {};

    public async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const data = request.body as SendEmailDTO;
            await this.sendEmailUseCase.execute(data);
            return reply.status(200).send({ message: "E-mail disparado com sucesso" });
        } catch (error: any) {
            console.error("[EmailController] Erro na requisição:", error.message);

            return reply.status(400).send({
                error: "Bad Request",
                message: error.message || "Falha ao processar a requisição de e-mail"
            });
        };
    };
};