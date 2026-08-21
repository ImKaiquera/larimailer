export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
  cid: string;
}

export class Email {
  private readonly to: string[];
  private readonly subject: string;
  private readonly htmlBody: string;
  private readonly attachments: EmailAttachment[];

  private constructor(to: string[], subject: string, htmlBody: string, attachments: EmailAttachment[]) {
    this.to = to;
    this.subject = subject;
    this.htmlBody = htmlBody;
    this.attachments = attachments;
  };

  public static create(to: string[], subject: string, htmlBody: string, attachments: EmailAttachment[] = []): Email {
    if (!to || to.length === 0) {
      throw new Error("Email must have at least one recipient!");
    };

    if (!subject || subject.trim() === "") {
      throw new Error("Email subject is required!");
    };

    if (!htmlBody || htmlBody.trim() === "") {
      throw new Error("Email body cannot be empty!");
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of to) {
      if (!emailRegex.test(email)) {
        throw new Error(`Invalid email address format: "${email}"!`);
      };
    };

    const attachmentCids = new Set<string>();
    for (const attachment of attachments) {
      if (!attachment.filename || !attachment.cid || !attachment.contentType || attachment.content.length === 0) {
        throw new Error("Email attachment is invalid!");
      };

      if (attachmentCids.has(attachment.cid)) {
        throw new Error(`Duplicate email attachment CID: "${attachment.cid}"!`);
      };
      attachmentCids.add(attachment.cid);
    };

    return new Email(to, subject, htmlBody, attachments);
  };

  public getTo(): string[] {
    return this.to;
  };

  public getSubject(): string {
    return this.subject;
  };

  public getHtmlBody(): string {
    return this.htmlBody;
  };

  public getAttachments(): EmailAttachment[] {
    return this.attachments;
  };
};
