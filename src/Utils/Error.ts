export class Err extends Error {
    code: string;

    constructor(message: string, name?: string) {
        super();
        this.name = `Keyvify_${name || "Error"}`;
        this.code = this.name;
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}