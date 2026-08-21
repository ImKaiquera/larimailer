import { IEmailService } from "../../../modules/emails/application/interfaces/IEmailService";
import { Email } from "../../../modules/emails/domain/entities/Email";
import { env } from "../../config/env";
import nodemailer from "nodemailer";

export class NodemailerAdapter implements IEmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: env.email.host,
            port: env.email.port,
            secure: env.email.port === 465,
            auth: {
                user: env.email.auth.user,
                pass: env.email.auth.pass
            }
        });
    };

    public async send(email: Email): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: `"LariMailer" <${env.email.auth.user}>`,
                to: email.getTo().join(', '),
                subject: email.getSubject(),
                html: email.getHtmlBody(),
                attachDataUrls: true,
                attachments: email.getAttachments().map((attachment) => ({
                    filename: attachment.filename,
                    content: attachment.content,
                    contentType: attachment.contentType,
                    cid: attachment.cid,
                    disposition: "inline"
                }))
            });

            console.log(`[SUCESSO] E-mail enviado para: ${email.getTo().join(', ')}`);
        } catch (error) {
            console.error("[ERRO] Falha no provedor Nodemailer:", error);
            throw new Error("Falha no provedor de e-mail ao tentar disparar a mensagem");
        }
    };
};
