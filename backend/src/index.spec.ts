import { afterEach, describe, expect, it } from "vitest";
import JSZip from "jszip";
import { IEmailService } from "./modules/emails/application/interfaces/IEmailService";
import { Email } from "./modules/emails/domain/entities/Email";
import { buildApp } from "./index";

class InMemoryEmailService implements IEmailService {
  public sentEmails: Email[] = [];

  async send(email: Email): Promise<void> {
    this.sentEmails.push(email);
  }
}

function multipartPayload(
  boundary: string,
  fields: Record<string, string>,
  file: { fieldname: string; filename: string; contentType: string; content: Buffer },
): Buffer {
  const chunks: Buffer[] = [];
  for (const [name, value] of Object.entries(fields)) {
    chunks.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
    ));
  }
  chunks.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`,
  ));
  chunks.push(file.content);
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  return Buffer.concat(chunks);
}

const apps: ReturnType<typeof buildApp>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("POST /api/send-email", () => {
  it("keeps accepting the existing JSON payload", async () => {
    const emailService = new InMemoryEmailService();
    const app = buildApp(emailService, false);
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/send-email",
      payload: {
        to: ["recipient@example.com"],
        subject: "JSON email",
        htmlBody: "<p>Hello</p>",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(emailService.sentEmails).toHaveLength(1);
    expect(emailService.sentEmails[0].getAttachments()).toHaveLength(0);
  });

  it("accepts a ZIP package and sends its image as an inline attachment", async () => {
    const zip = new JSZip();
    zip.file("index.html", `<img src="images/heart.png">`);
    zip.file("images/heart.png", Buffer.from("heart-image"));
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const boundary = "larimailer-test-boundary";
    const emailService = new InMemoryEmailService();
    const app = buildApp(emailService, false);
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/send-email",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
      payload: multipartPayload(
        boundary,
        { to: JSON.stringify(["recipient@example.com"]), subject: "ZIP email" },
        { fieldname: "file", filename: "email.zip", contentType: "application/zip", content: zipBuffer },
      ),
    });

    expect(response.statusCode).toBe(200);
    expect(emailService.sentEmails).toHaveLength(1);
    expect(emailService.sentEmails[0].getHtmlBody()).toContain("cid:asset-");
    expect(emailService.sentEmails[0].getAttachments()).toHaveLength(1);
  });
});
