// Every MLS state-changing operation for a conversation (join, encrypt,
// decrypt) does read-modify-save on that SAME local group state -- safe only
// one operation at a time, strictly in order. Identical to the mobile app's
// own src/services/e2ee/conversationLock.ts -- nothing about this needs to
// differ for the browser; React's own render/effect scheduling can just as
// easily trigger two overlapping calls into cipher.ts/group.ts for the same
// conversation as React Native's can.

const locks = new Map<string, Promise<unknown>>();

export function withConversationLock<T>(conversationId: string, fn: () => Promise<T>): Promise<T> {
  const previous = locks.get(conversationId) ?? Promise.resolve();
  const settled = previous.then(fn, fn);
  locks.set(
    conversationId,
    settled.then(
      () => undefined,
      () => undefined,
    ),
  );
  return settled;
}
