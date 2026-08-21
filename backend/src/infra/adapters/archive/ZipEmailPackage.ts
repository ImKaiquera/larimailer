import { createHash } from "node:crypto";
import path from "node:path";
import JSZip from "jszip";
import { EmailPackageError } from "../../../modules/emails/application/errors/EmailPackageError";
import {
  IEmailPackageService,
  ProcessedEmailPackage,
} from "../../../modules/emails/application/interfaces/IEmailPackageService";
import { EmailAttachment } from "../../../modules/emails/domain/entities/Email";

export const ZIP_UPLOAD_MAX_SIZE = 4 * 1024 * 1024;
const MAX_UNCOMPRESSED_SIZE = 25 * 1024 * 1024;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_HTML_SIZE = 2 * 1024 * 1024;
const MAX_FILES = 100;

const CONTENT_TYPES: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};

type ZipObjectWithSize = JSZip.JSZipObject & {
  _data?: { uncompressedSize?: number };
};

function isIgnoredSystemFile(filePath: string): boolean {
  return filePath.startsWith("__MACOSX/") || path.posix.basename(filePath) === ".DS_Store";
}

function assertSafeArchivePath(filePath: string): void {
  const normalized = filePath.replaceAll("\\", "/");
  const segments = normalized.split("/");

  if (
    normalized.includes("\0") ||
    normalized.startsWith("/") ||
    /^[a-zA-Z]:\//.test(normalized) ||
    segments.includes("..")
  ) {
    throw new EmailPackageError(`O pacote contém um caminho de arquivo inválido: "${filePath}".`);
  }
}

function findHtmlEntry(entries: JSZip.JSZipObject[]): JSZip.JSZipObject {
  const htmlEntries = entries.filter((entry) => path.posix.extname(entry.name).toLowerCase() === ".html");
  const rootIndex = htmlEntries.find((entry) => entry.name.toLowerCase() === "index.html");

  if (rootIndex) return rootIndex;
  if (htmlEntries.length === 1) return htmlEntries[0];

  const nestedIndexes = htmlEntries.filter(
    (entry) => path.posix.basename(entry.name).toLowerCase() === "index.html",
  );
  if (nestedIndexes.length === 1) return nestedIndexes[0];

  if (htmlEntries.length === 0) {
    throw new EmailPackageError("Nenhum arquivo HTML foi encontrado no pacote ZIP.");
  }

  throw new EmailPackageError("O pacote contém vários arquivos HTML e não foi possível identificar o principal.");
}

function isExternalReference(reference: string): boolean {
  return /^(?:https?:|data:|cid:|mailto:|tel:|#|\/\/)/i.test(reference.trim());
}

function resolveArchiveReference(reference: string, htmlDirectory: string): string | null {
  const cleanReference = reference.trim().split(/[?#]/, 1)[0];
  if (!cleanReference || isExternalReference(cleanReference)) return null;

  let decodedReference: string;
  try {
    decodedReference = decodeURIComponent(cleanReference).replaceAll("\\", "/");
  } catch {
    throw new EmailPackageError(`A referência de imagem "${reference}" é inválida.`);
  }

  const resolved = decodedReference.startsWith("/")
    ? path.posix.normalize(decodedReference.slice(1))
    : path.posix.normalize(path.posix.join(htmlDirectory, decodedReference));

  if (resolved === ".." || resolved.startsWith("../")) {
    throw new EmailPackageError(`A referência de imagem "${reference}" aponta para fora do pacote.`);
  }

  return resolved;
}

function createCid(filePath: string): string {
  const digest = createHash("sha256").update(filePath).digest("hex").slice(0, 20);
  return `asset-${digest}@larimailer`;
}

async function readEntryWithLimit(entry: JSZip.JSZipObject, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let completed = false;
    const stream = entry.nodeStream("nodebuffer") as NodeJS.ReadableStream & {
      destroy?: (error?: Error) => void;
    };

    stream.on("data", (chunk: Buffer | Uint8Array) => {
      if (completed) return;

      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > limit) {
        completed = true;
        const error = new EmailPackageError(`O arquivo "${entry.name}" excede o limite permitido.`, 413);
        stream.pause();
        stream.destroy?.(error);
        reject(error);
        return;
      }
      chunks.push(buffer);
    });
    stream.on("error", (error) => {
      if (!completed) {
        completed = true;
        reject(error);
      }
    });
    stream.on("end", () => {
      if (!completed) {
        completed = true;
        resolve(Buffer.concat(chunks, size));
      }
    });
  });
}

export class ZipEmailPackageAdapter implements IEmailPackageService {
  public async process(file: Buffer): Promise<ProcessedEmailPackage> {
    if (file.length === 0) {
      throw new EmailPackageError("O pacote ZIP está vazio.");
    }

    if (file.length > ZIP_UPLOAD_MAX_SIZE) {
      throw new EmailPackageError("O pacote ZIP excede o limite de 4 MB.", 413);
    }

    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(file, { checkCRC32: false, createFolders: false });
    } catch {
      throw new EmailPackageError("O arquivo ZIP é inválido ou está corrompido.");
    }

    const entries = Object.values(zip.files).filter(
      (entry) => !entry.dir && !isIgnoredSystemFile(entry.name),
    );

    if (entries.length === 0) {
      throw new EmailPackageError("O pacote ZIP não contém arquivos.");
    }

    if (entries.length > MAX_FILES) {
      throw new EmailPackageError(`O pacote ZIP excede o limite de ${MAX_FILES} arquivos.`, 413);
    }

    let declaredTotalSize = 0;
    for (const entry of entries) {
      assertSafeArchivePath(entry.unsafeOriginalName ?? entry.name);

      const extension = path.posix.extname(entry.name).toLowerCase();
      if (extension !== ".html" && !(extension in CONTENT_TYPES)) {
        throw new EmailPackageError(`O formato do arquivo "${entry.name}" não é permitido.`);
      }

      const declaredSize = (entry as ZipObjectWithSize)._data?.uncompressedSize;
      if (typeof declaredSize === "number") {
        if (declaredSize > MAX_FILE_SIZE) {
          throw new EmailPackageError(`O arquivo "${entry.name}" excede o limite permitido.`, 413);
        }
        declaredTotalSize += declaredSize;
      }
    }

    if (declaredTotalSize > MAX_UNCOMPRESSED_SIZE) {
      throw new EmailPackageError("O conteúdo descompactado excede o limite de 25 MB.", 413);
    }

    const htmlEntry = findHtmlEntry(entries);
    const fileContents = new Map<string, Buffer>();
    let actualTotalSize = 0;

    for (const entry of entries) {
      const extension = path.posix.extname(entry.name).toLowerCase();
      const entryLimit = extension === ".html" ? MAX_HTML_SIZE : MAX_FILE_SIZE;
      const content = await readEntryWithLimit(
        entry,
        Math.min(entryLimit, MAX_UNCOMPRESSED_SIZE - actualTotalSize),
      );
      actualTotalSize += content.length;

      if (actualTotalSize > MAX_UNCOMPRESSED_SIZE) {
        throw new EmailPackageError("O conteúdo descompactado excede os limites permitidos.", 413);
      }

      fileContents.set(entry.name, content);
    }

    const htmlBuffer = fileContents.get(htmlEntry.name);
    if (!htmlBuffer) {
      throw new EmailPackageError("Não foi possível ler o arquivo HTML principal.");
    }

    const htmlDirectory = path.posix.dirname(htmlEntry.name) === "."
      ? ""
      : path.posix.dirname(htmlEntry.name);
    const attachmentsByPath = new Map<string, EmailAttachment>();

    const replaceAssetReference = (reference: string): string => {
      const assetPath = resolveArchiveReference(reference, htmlDirectory);
      if (!assetPath) return reference;

      const extension = path.posix.extname(assetPath).toLowerCase();
      if (!(extension in CONTENT_TYPES)) return reference;

      const content = fileContents.get(assetPath);
      if (!content) {
        throw new EmailPackageError(`A imagem referenciada "${reference}" não foi encontrada no pacote.`);
      }

      let attachment = attachmentsByPath.get(assetPath);
      if (!attachment) {
        attachment = {
          filename: path.posix.basename(assetPath),
          content,
          contentType: CONTENT_TYPES[extension],
          cid: createCid(assetPath),
        };
        attachmentsByPath.set(assetPath, attachment);
      }

      return `cid:${attachment.cid}`;
    };

    let htmlBody = htmlBuffer.toString("utf8");
    htmlBody = htmlBody.replace(
      /\b(src|background)\s*=\s*(["'])(.*?)\2/gi,
      (match, attribute: string, quote: string, reference: string) => {
        const replacement = replaceAssetReference(reference);
        return replacement === reference ? match : `${attribute}=${quote}${replacement}${quote}`;
      },
    );
    htmlBody = htmlBody.replace(
      /url\(\s*(["']?)(.*?)\1\s*\)/gi,
      (match, quote: string, reference: string) => {
        const replacement = replaceAssetReference(reference);
        return replacement === reference ? match : `url(${quote}${replacement}${quote})`;
      },
    );

    return {
      htmlBody,
      attachments: [...attachmentsByPath.values()],
    };
  }
}
