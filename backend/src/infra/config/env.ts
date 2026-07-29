import dotenv from "dotenv";

dotenv.config();

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || "";

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn("[ENV WARNING] EMAIL_USER or EMAIL_PASSWORD environment variables are missing!");
};

export const env = {
    infra: {
        port: Number(process.env.INFRA_PORT || 3000),
        host: process.env.INFRA_HOST || "0.0.0.0",
        vercel: process.env.VERCEL
    },
    email: {
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASSWORD
        }
    }
} as const;