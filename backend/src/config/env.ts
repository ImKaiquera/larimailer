import dotenv from "dotenv";

dotenv.config();

if (!process.env.PORT) { throw new Error("[ENV] PORT IS REQUIRED!"); };
if (!process.env.HOST) { throw new Error("[ENV] HOST IS REQUIRED!"); };

export const env = {
    infra: {
        port: Number(process.env.PORT),
        host: process.env.HOST
    }
} as const;