import { IEmailService } from "../interfaces/IEmailService";
import { Email, EmailAttachment } from "../../domain/entities/Email";

export interface SendEmailDTO {
    to: string[];
    subject: string;
    htmlBody: string;
    attachments?: EmailAttachment[];
};

export class SendEmail {
    constructor(private readonly emailService: IEmailService) { };

    public async execute(data: SendEmailDTO): Promise<void> {
        const emailEntity = Email.create(data.to, data.subject, data.htmlBody, data.attachments);
        await this.emailService.send(emailEntity);
    };
};
