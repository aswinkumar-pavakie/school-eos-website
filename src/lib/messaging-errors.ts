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
