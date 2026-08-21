import { SendEmail, SendEmailDTO } from "../application/useCases/SendEmail";
import { IEmailPackageService } from "../application/interfaces/IEmailPackageService";
import { EmailPackageError } from "../application/errors/EmailPackageError";
import { FastifyRequest, FastifyReply } from "fastify";

export class EmailController {
    constructor(
        private readonly sendEmailUseCase: SendEmail,
        private readonly emailPackageService: IEmailPackageService
    ) {};

    private async parseMultipartRequest(request: FastifyRequest): Promise<SendEmailDTO> {
        let recipients: string[] | undefined;
        let subject: string | undefined;
        let packageBuffer: Buffer | undefined;

        for await (const part of request.parts()) {
            if (part.type === "file") {
                if (part.fieldname !== "file" || packageBuffer) {
                    throw new EmailPackageError("A requisição deve conter apenas um arquivo ZIP.");
                }

                if (!part.filename.toLowerCase().endsWith(".zip")) {
                    throw new EmailPackageError("O arquivo enviado deve possuir a extensão .zip.");
                }

                packageBuffer = await part.toBuffer();
                continue;
            }

            if (part.fieldname === "to") {
                try {
                    const parsedRecipients: unknown = JSON.parse(String(part.value));
                    if (!Array.isArray(parsedRecipients) || !parsedRecipients.every((value) => typeof value === "string")) {
                        throw new Error();
                    }
                    recipients = parsedRecipients;
                } catch {
                    throw new EmailPackageError("A lista de destinatários do pacote é inválida.", 400);
                }
            } else if (part.fieldname === "subject") {
                subject = String(part.value);
            }
        }

        if (!recipients || !subject || !packageBuffer) {
            throw new EmailPackageError("Destinatários, assunto e arquivo ZIP são obrigatórios.", 400);
        }

        const processedPackage = await this.emailPackageService.process(packageBuffer);
        return {
            to: recipients,
            subject,
            htmlBody: processedPackage.htmlBody,
            attachments: processedPackage.attachments,
        };
    };

    public async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const data = request.isMultipart()
                ? await this.parseMultipartRequest(request)
                : request.body as SendEmailDTO;
            await this.sendEmailUseCase.execute(data);
            return reply.status(200).send({ message: "E-mail disparado com sucesso" });
        } catch (error: unknown) {
            const message = error instanceof Error
                ? error.message
                : "Falha ao processar a requisição de e-mail";
            const statusCode = error instanceof EmailPackageError
                ? error.statusCode
                : typeof error === "object" && error !== null && "statusCode" in error && typeof error.statusCode === "number"
                    ? error.statusCode
                    : 400;

            console.error("[EmailController] Erro na requisição:", message);

            return reply.status(statusCode).send({
                error: statusCode === 413 ? "Payload Too Large" : "Bad Request",
                message,
            });
        };
    };
};
