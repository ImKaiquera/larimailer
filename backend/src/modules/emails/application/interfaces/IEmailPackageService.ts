import { EmailAttachment } from "../../domain/entities/Email";

export interface ProcessedEmailPackage {
  htmlBody: string;
  attachments: EmailAttachment[];
}

export interface IEmailPackageService {
  process(file: Buffer): Promise<ProcessedEmailPackage>;
}
