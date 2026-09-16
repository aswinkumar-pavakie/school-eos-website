// Orchestrates starting a brand-new conversation or request -- identical
// logic to the mobile app's own src/features/messaging-v2/hooks.ts
// (finishConversationCreation, useStartDirectConversation, useCreateRequest).

import { getKeyBundleAction, createConversationAction, createRequestAction, sendMessageAction, type CreateConversationResult } from "../messaging-actions";
import { encryptMessage } from "./cipher";
import { createGroupForConversation } from "./group";
import { discardGroupState, hasGroupState, renameGroupState, saveSentPlaintext } from "./storage";

// Server Actions don't preserve a thrown error's class across the client/
// server RPC boundary -- only its message text survives, and messagingRequest
// (messaging-actions.ts) falls back to the backend's raw `code` as that text
// when there's no separate `.message` (e.g. literally "RECIPIENT_NOT_FOUND").
// Matched by that literal code string here, not `instanceof`, for exactly
// that reason -- never shown to the user as a raw backend code.
const FRIENDLY_KEY_BUNDLE_ERRORS: Record<string, string> = {
  RECIPIENT_NOT_FOUND: "This person has not finished setting up secure messaging yet -- ask them to sign in once, then try again.",
  ACCESS_DENIED: "You're not able to message this person.",
};

async function fetchTargetKeyBundle(targetPersonId: string) {
  try {
    const { data: bundles } = await getKeyBundleAction(targetPersonId);
    return bundles;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    throw new Error(FRIENDLY_KEY_BUNDLE_ERRORS[message] ?? "Could not reach this person's device. Please try again.");
  }
}

/** Handles the create-conversation/create-request response. When the server
 * says this was a genuinely NEW conversation, the group this browser just
 * created locally (under tempGroupId) really is the group -- persist it
 * under the real id. When it was NOT new (someone already had an active
 * conversation with this target), this browser's freshly-generated group
 * must be thrown away; if this browser already has valid state for the real
 * conversation, the typed message is sent for real through the ordinary
 * steady-state path instead of being silently lost. */
async function finishConversationCreation(
  tempGroupId: string,
  result: CreateConversationResult,
  plaintext: string | undefined,
  initialClientMessageId: string,
): Promise<void> {
  if (result.isNew) {
    await renameGroupState(tempGroupId, result.conversationId);
    if (plaintext) {
      await saveSentPlaintext(result.conversationId, initialClientMessageId, plaintext);
    }
    return;
  }

  await discardGroupState(tempGroupId);
  if (!plaintext) return;

  if (!(await hasGroupState(result.conversationId))) {
    throw new Error(
      "You already have a conversation with this person, but this browser has lost access to it. Open it from your conversations list instead.",
    );
  }
  const clientMessageId = crypto.randomUUID();
  const encrypted = await encryptMessage(result.conversationId, plaintext);
  await sendMessageAction(result.conversationId, { clientMessageId, ciphertext: encrypted.ciphertext, encryptionVersion: encrypted.encryptionVersion });
  await saveSentPlaintext(result.conversationId, clientMessageId, plaintext);
}

/** Starts a new conversation with someone already ALLOW_DIRECT-eligible. */
export async function startDirectConversation(input: { targetPersonId: string; plaintext?: string }): Promise<CreateConversationResult> {
  const bundles = await fetchTargetKeyBundle(input.targetPersonId);
  const bundle = bundles.find((b) => b.mlsKeyPackage);
  if (!bundle?.mlsKeyPackage) {
    throw new Error("This person has not finished setting up secure messaging on any device yet.");
  }

  const { welcomeWire, tempGroupId } = await createGroupForConversation(bundle.mlsKeyPackage.data);

  const initialClientMessageId = crypto.randomUUID();
  const initialMessage = input.plaintext
    ? await (async () => {
        const encrypted = await encryptMessage(tempGroupId, input.plaintext!);
        return { clientMessageId: initialClientMessageId, ciphertext: encrypted.ciphertext, encryptionVersion: encrypted.encryptionVersion };
      })()
    : undefined;

  const { data: result } = await createConversationAction({ targetPersonId: input.targetPersonId, mlsWelcome: welcomeWire, initialMessage });
  await finishConversationCreation(tempGroupId, result, input.plaintext, initialClientMessageId);
  return result;
}

/** Same shape as startDirectConversation, but for an UNSCOPED target
 * (messagingMode REQUEST) -- initialMessage is mandatory. */
export async function createMessageRequest(input: { targetPersonId: string; plaintext: string }): Promise<CreateConversationResult> {
  const bundles = await fetchTargetKeyBundle(input.targetPersonId);
  const bundle = bundles.find((b) => b.mlsKeyPackage);
  if (!bundle?.mlsKeyPackage) {
    throw new Error("This person has not finished setting up secure messaging on any device yet.");
  }

  const { welcomeWire, tempGroupId } = await createGroupForConversation(bundle.mlsKeyPackage.data);
  const encrypted = await encryptMessage(tempGroupId, input.plaintext);
  const initialClientMessageId = crypto.randomUUID();

  const { data: result } = await createRequestAction({
    targetPersonId: input.targetPersonId,
    mlsWelcome: welcomeWire,
    initialMessage: { clientMessageId: initialClientMessageId, ciphertext: encrypted.ciphertext, encryptionVersion: encrypted.encryptionVersion },
  });
  await finishConversationCreation(tempGroupId, result, input.plaintext, initialClientMessageId);
  return result;
}
