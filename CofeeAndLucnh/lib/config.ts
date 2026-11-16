/** Only emails on this domain can self-register (the database enforces it too). */
export const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "manush.tech";
