import { Email } from "../../domain/entities/Email";

export interface IEmailService {
    send(email: Email): Promise<void>;
};