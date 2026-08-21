import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { ZIP_UPLOAD_MAX_SIZE, ZipEmailPackageAdapter } from "./ZipEmailPackage";

async function createZip(files: Record<string, string | Buffer>): Promise<Buffer> {
  const zip = new JSZip();
  for (const [filePath, content] of Object.entries(files)) {
    zip.file(filePath, content);
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

describe("ZipEmailPackageAdapter", () => {
  const adapter = new ZipEmailPackageAdapter();

  it("rewrites local HTML and CSS images as deduplicated CID attachments", async () => {
    const zip = await createZip({
      "index.html": `
        <html>
          <style>.hero { background-image: url('./images/banner.png'); }</style>
          <body background="images/background.jpg">
            <img src="images/banner.png">
            <img src="https://example.com/external.png">
          </body>
        </html>
      `,
      "images/banner.png": Buffer.from("banner-image"),
      "images/background.jpg": Buffer.from("background-image"),
    });

    const result = await adapter.process(zip);

    expect(result.attachments).toHaveLength(2);
    expect(result.htmlBody).not.toContain("images/banner.png");
    expect(result.htmlBody).not.toContain("images/background.jpg");
    expect(result.htmlBody).toContain("https://example.com/external.png");
    expect(result.htmlBody.match(/cid:asset-/g)).toHaveLength(3);
    expect(result.attachments.map((attachment) => attachment.contentType).sort()).toEqual([
      "image/jpeg",
      "image/png",
    ]);
  });

  it("resolves assets relative to a nested HTML file", async () => {
    const zip = await createZip({
      "email/template.html": `<img src="../images/photo.png">`,
      "images/photo.png": Buffer.from("photo"),
    });

    const result = await adapter.process(zip);

    expect(result.attachments).toHaveLength(1);
    expect(result.htmlBody).toContain(`src="cid:${result.attachments[0].cid}"`);
  });

  it("rejects a package without HTML", async () => {
    const zip = await createZip({ "image.png": Buffer.from("image") });
    await expect(adapter.process(zip)).rejects.toThrow("Nenhum arquivo HTML");
  });

  it("rejects ambiguous packages with multiple HTML files", async () => {
    const zip = await createZip({
      "first.html": "<p>first</p>",
      "second.html": "<p>second</p>",
    });
    await expect(adapter.process(zip)).rejects.toThrow("vários arquivos HTML");
  });

  it("rejects missing referenced images", async () => {
    const zip = await createZip({ "index.html": `<img src="images/missing.png">` });
    await expect(adapter.process(zip)).rejects.toThrow("não foi encontrada");
  });

  it("rejects unsafe archive paths", async () => {
    const zip = await createZip({
      "index.html": "<p>safe</p>",
      "../secret.png": Buffer.from("secret"),
    });
    await expect(adapter.process(zip)).rejects.toThrow("caminho de arquivo inválido");
  });

  it("rejects unsupported file formats", async () => {
    const zip = await createZip({
      "index.html": "<p>email</p>",
      "script.js": "alert('nope')",
    });
    await expect(adapter.process(zip)).rejects.toThrow("não é permitido");
  });

  it("rejects archives above the Vercel-safe upload limit", async () => {
    const oversizedFile = Buffer.alloc(ZIP_UPLOAD_MAX_SIZE + 1);
    await expect(adapter.process(oversizedFile)).rejects.toMatchObject({ statusCode: 413 });
  });
});
