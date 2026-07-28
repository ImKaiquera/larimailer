import dotenv from "dotenv";

dotenv.config();

if (!process.env.EMAIL_HOST) { throw new Error("[ENV] EMAIL_HOST IS REQUIRED!"); };
if (!process.env.EMAIL_PORT) { throw new Error("[ENV] EMAIL_PORT IS REQUIRED!"); };
if (!process.env.EMAIL_USER) { throw new Error("[ENV] EMAIL_USER IS REQUIRED!"); };
if (!process.env.EMAIL_PASSWORD) { throw new Error("[ENV] EMAIL_PASSWORD IS REQUIRED!"); };

export const env = {
    infra: {
        port: Number(process.env.INFRA_PORT || 3000),
        host: process.env.INFRA_HOST || "0.0.0.0",
        vercel: process.env.VERCEL
    },
    email: {
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    }
} as const;