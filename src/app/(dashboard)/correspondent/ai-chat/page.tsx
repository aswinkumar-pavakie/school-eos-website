// Ask the Assistant -- real AI bot (school-eos-ai-bot, a separate service)
// wired in via the same-origin src/app/api/ai-chat/route.ts proxy (see its
// own header comment). No separate login for this feature: it reuses this
// app's own existing signed-in session end to end.

import { AiChatScreen } from "@/components/ai-chat/AiChatScreen";

export default function AiChatPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Ask the Assistant</h1>
        <p className="mt-1 text-sm text-text-muted">Ask a question about school records, policies or anything else.</p>
      </div>
      <AiChatScreen />
    </div>
  );
}
