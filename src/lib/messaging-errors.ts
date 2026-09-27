// A "use server" file (see messaging-actions.ts) may only export async
// functions -- Next.js's Server Actions compiler rejects any other runtime
// export (a class included), which silently broke every import from that
// module in the client bundle. This error class lives here instead, in a
// plain module, imported by both messaging-actions.ts and any client code
// that wants to catch it specifically.

export class MessagingApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  constructor(status: number, code: string | undefined, message: string) {
    super(message);
    this.name = "MessagingApiError";
    this.status = status;
    this.code = code;
  }
}

// Plain-language text for the messaging service's error codes. Server Actions
// only carry the message text across to the browser (the code survives as the
// message when the service sends no message), so this matches a known code
// inside whatever text arrives and returns words a person can act on.
const FRIENDLY_MESSAGES: Record<string, string> = {
  RATE_LIMITED: "You're doing that too quickly. Please wait a minute and try again.",
  RECIPIENT_NOT_FOUND: "This person hasn't set up messaging yet, so they can't receive messages right now. Ask them to open Messages once, then try again.",
  ACCESS_DENIED: "You don't have permission to message this person.",
  MESSAGING_DISABLED: "Messaging isn't available for this account.",
  CONVERSATION_NOT_FOUND: "That conversation could not be found.",
  CONVERSATION_NOT_ACTIVE: "This conversation is closed, so new messages can't be sent.",
  REQUEST_REQUIRED: "You need to send a message request first. This person will see it and can accept.",
  REQUEST_PENDING: "Your message request is still waiting for a reply.",
  REQUEST_ALREADY_SENT: "You already sent this person a message request.",
  REQUEST_NOT_ALLOWED: "You can't send a message request to this person.",
  MESSAGE_LIMIT_REACHED: "You've reached the message limit for now. Please try again later.",
  DEVICE_REVOKED: "This browser was signed out of secure messaging. Reload the page to set it up again.",
  KEY_INVALID: "Secure messaging setup is out of date. Reload the page and try again.",
  MESSAGE_TOO_LARGE: "That message is too long to send.",
  AUTHENTICATION_REQUIRED: "Your session has ended. Please sign in again.",
};

export function friendlyMessagingError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const text = err instanceof Error ? err.message : "";
  for (const [code, message] of Object.entries(FRIENDLY_MESSAGES)) {
    if (text.includes(code)) return message;
  }
  return text || fallback;
}
