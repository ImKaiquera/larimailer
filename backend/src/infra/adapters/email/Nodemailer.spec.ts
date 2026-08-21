import { describe, expect, it } from "vitest";
import nodemailer from "nodemailer";

describe("Nodemailer inline data URLs", () => {
  it("converts a Base64 image into a CID attachment", async () => {
    const transporter = nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: "unix",
    });
    const base64Image = Buffer.from("fake-png-content").toString("base64");

    const result = await transporter.sendMail({
      from: "sender@example.com",
      to: "recipient@example.com",
      subject: "Base64 test",
      html: `<p>Image test</p><img src="data:image/png;base64,${base64Image}">`,
      attachDataUrls: true,
    });
    const message = result.message.toString("utf8");

    expect(message).not.toContain("data:image/png;base64");
    expect(message).toContain("Content-Type: image/png");
    expect(message).toContain("Content-ID:");
    expect(message).toContain("cid:");
  });
});
