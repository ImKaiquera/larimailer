export class Email {
  private readonly to: string[];
  private readonly subject: string;
  private readonly htmlBody: string;

  private constructor(to: string[], subject: string, htmlBody: string) {
    this.to = to;
    this.subject = subject;
    this.htmlBody = htmlBody;
  };

  public static create(to: string[], subject: string, htmlBody: string): Email {
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

    return new Email(to, subject, htmlBody);
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
};