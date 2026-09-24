type AuthError = { status?: number; code?: string; message?: string } | null | undefined;

const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match. Check them and try again.",
  EMAIL_NOT_VERIFIED: "Please confirm your email first. We've sent you a link.",
  PASSWORD_TOO_SHORT: "Your password needs at least 8 characters.",
  PASSWORD_TOO_LONG: "Your password can be at most 128 characters.",
  INVALID_EMAIL: "Enter an email address like name@example.com.",
  INVALID_TOKEN: "This link has expired or was already used. Request a new one.",
  USER_ALREADY_EXISTS: "Something went wrong. Please try again.",
};

/** Turns an auth error into a plain sentence that says what went wrong and what to do. */
export function authErrorMessage(error: AuthError): string {
  if (error?.status === 429) {
    return "Too many attempts. Please wait a minute, then try again.";
  }
  if (error?.code && messages[error.code]) return messages[error.code];
  return "Something went wrong on our side. Please try again in a moment.";
}
