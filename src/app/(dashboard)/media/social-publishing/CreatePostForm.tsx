"use client";

import { useActionState, useRef, useState } from "react";
import { createMediaPostAction, type FormState } from "./actions";

const initial: FormState = {};

const FORMATS: { value: string; label: string }[] = [
  { value: "POST", label: "Post" },
  { value: "PHOTO_CAROUSEL", label: "Photo carousel" },
  { value: "VIDEO", label: "Video" },
  { value: "ANNOUNCEMENT_CARD", label: "Notice card" },
];
const CATEGORIES: { value: string; label: string }[] = [
  { value: "EVENT", label: "Event" },
  { value: "ACADEMIC", label: "Academic" },
  { value: "DEPARTMENT", label: "Department" },
  { value: "GENERAL", label: "General" },
];

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? "1px solid var(--med-primary)" : "1px solid var(--med-border)",
        background: active ? "var(--med-tint)" : "#fff",
        color: active ? "var(--med-primary)" : "var(--med-ink)",
        borderRadius: 10,
        padding: "9px 14px",
        fontSize: 13.5,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

export function CreatePostForm() {
  const [state, formAction, pending] = useActionState(createMediaPostAction, initial);
  const [format, setFormat] = useState("POST");
  const [category, setCategory] = useState("EVENT");
  const [caption, setCaption] = useState("");
  const [pinToTop, setPinToTop] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 20, marginTop: 28, alignItems: "start" }}>
      <form action={formAction} style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "26px 28px" }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>New post</div>
        <div style={{ fontSize: 13.5, color: "var(--med-body-muted)", marginTop: 4 }}>Goes to the school app Explore feed</div>

        <input type="hidden" name="format" value={format} />
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)", marginTop: 22 }}>Post format</div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {FORMATS.map((f) => (
            <Chip key={f.value} active={format === f.value} onClick={() => setFormat(f.value)}>{f.label}</Chip>
          ))}
        </div>

        <input type="hidden" name="category" value={category} />
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)", marginTop: 22 }}>Post category</div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => (
            <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>{c.label}</Chip>
          ))}
        </div>

        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)", marginTop: 22 }}>Caption</div>
        <textarea
          name="caption"
          rows={6}
          maxLength={2200}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write the caption. Mention the department, date, venue and the registration link."
          style={{ width: "100%", marginTop: 10, border: "1px solid var(--med-input-border)", borderRadius: 12, padding: "14px 16px", fontSize: 14.5, lineHeight: 1.6, color: "var(--med-ink)", outline: "none", resize: "vertical", fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
          <span style={{ fontFamily: "var(--med-mono)", fontSize: 12.5, color: "var(--med-tertiary)" }}>{caption.length} / 2200</span>
          <span style={{ fontSize: 12.5, color: "var(--med-tertiary-2)" }}>· #PavakiePublicSchool #PPS</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 22 }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Publish date</div>
            <input type="date" name="publishDate" style={{ width: "100%", height: 48, marginTop: 10, border: "1px solid var(--med-input-border)", borderRadius: 12, padding: "0 14px", fontSize: 14.5, color: "var(--med-ink)", outline: "none", fontFamily: "inherit" }} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Publish time</div>
            <input type="time" name="publishTime" style={{ width: "100%", height: 48, marginTop: 10, border: "1px solid var(--med-input-border)", borderRadius: 12, padding: "0 14px", fontSize: 14.5, color: "var(--med-ink)", outline: "none", fontFamily: "inherit" }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>First comment</div>
            <input name="firstComment" placeholder="Hashtags or credits posted as the first comment" style={{ width: "100%", height: 48, marginTop: 10, border: "1px solid var(--med-input-border)", borderRadius: 12, padding: "0 14px", fontSize: 14.5, outline: "none", fontFamily: "inherit" }} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Link in post</div>
            <input name="linkUrl" type="url" placeholder="Registration or admissions link" style={{ width: "100%", height: 48, marginTop: 10, border: "1px solid var(--med-input-border)", borderRadius: 12, padding: "0 14px", fontSize: 14.5, outline: "none", fontFamily: "inherit" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          {pinToTop && <input type="hidden" name="pinToTop" value="on" />}
          <Chip active={pinToTop} onClick={() => setPinToTop((v) => !v)}>{pinToTop ? "✓ Pinned to top of Explore" : "Pin to top of Explore"}</Chip>
          {allowComments && <input type="hidden" name="allowComments" value="on" />}
          <Chip active={allowComments} onClick={() => setAllowComments((v) => !v)}>{allowComments ? "✓ Comments allowed" : "Comments off"}</Chip>
        </div>

        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)", marginTop: 22 }}>Creative</div>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{ marginTop: 10, border: "1px dashed var(--med-tertiary-2)", borderRadius: 12, height: 150, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", background: "repeating-linear-gradient(135deg,var(--med-panel),var(--med-panel) 8px,var(--med-panel) 8px,var(--med-panel) 16px)" }}
        >
          <input
            ref={fileInputRef}
            type="file"
            name="files"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.avi,.mkv"
            style={{ display: "none" }}
            onChange={(e) => setFileNames(Array.from(e.target.files ?? []).map((f) => f.name))}
          />
          <div style={{ fontFamily: "var(--med-mono)", fontSize: 12.5, color: "var(--med-tertiary)" }}>{fileNames.length > 0 ? fileNames.join(", ") : "drop photos / videos here"}</div>
          <div style={{ fontSize: 12.5, color: "var(--med-tertiary-2)" }}>Several files allowed — viewers swipe through them. First one is the cover.</div>
        </div>

        {state.error && (
          <div style={{ marginTop: 14, fontSize: 13.5, fontWeight: 700, color: "var(--med-red)", background: "var(--med-red-bg)", borderRadius: 10, padding: "10px 14px" }}>{state.error}</div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24 }}>
          <div style={{ flex: 1 }} />
          <button
            type="submit"
            name="saveAsDraft"
            value="true"
            onClick={() => setSaveAsDraft(true)}
            className="media-btn-hover-ghost"
            style={{ height: 48, padding: "0 20px", borderRadius: 11, border: "1px solid var(--med-border)", background: "#fff", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            Save draft
          </button>
          <button
            type="submit"
            name="saveAsDraft"
            value="false"
            onClick={() => setSaveAsDraft(false)}
            className="media-btn-hover-navy"
            style={{ height: 48, padding: "0 24px", borderRadius: 11, border: 0, background: "var(--med-navy)", color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            {pending ? (saveAsDraft ? "Saving…" : "Publishing…") : "Publish now"}
          </button>
        </div>
      </form>

      <div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>App preview</div>
        <div style={{ marginTop: 16, border: "1px solid var(--med-border)", borderRadius: 20, padding: 18, background: "#fff" }}>
          <div style={{ background: "var(--med-primary)", borderRadius: 14, padding: "16px 18px", color: "#fff" }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Hi, Student</div>
            <div style={{ fontSize: 13.5, marginTop: 2, opacity: 0.9 }}>Good Morning!</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 14, padding: 16, marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--med-navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11 }}>PPS</div>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>Pavakie Public School</span>
            </div>
            <div style={{ fontSize: 13.5, color: "var(--med-tertiary)", marginTop: 10 }}>{caption || "Your caption will appear here…"}</div>
            <div style={{ marginTop: 12, borderRadius: 10, background: "var(--med-panel)", height: 150, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--med-mono)", fontSize: 12, color: "var(--med-tertiary-2)" }}>
              {fileNames.length > 0 ? fileNames[0] : "creative 1080 × 1350"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
