"use client";

import { useActionState, useRef, useState } from "react";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { createMediaPostAction, type FormState } from "./actions";

const initial: FormState = {};

const FORMATS: { value: string; label: string }[] = [
  { value: "POST", label: "Post" },
  { value: "PHOTO_CAROUSEL", label: "Photo carousel" },
  { value: "VIDEO", label: "Video" },
  { value: "ANNOUNCEMENT_CARD", label: "Announcement card" },
];

const CATEGORIES: { value: string; label: string }[] = [
  { value: "EVENT", label: "Event" },
  { value: "ACADEMIC", label: "Academic" },
  { value: "DEPARTMENT", label: "Department" },
  { value: "GENERAL", label: "General" },
];

function ToggleChip({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked ?? false);
  return (
    <label
      className={`flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-input)] border px-3.5 py-2.5 text-sm font-bold ${
        checked ? "border-primary bg-field text-primary" : "border-border text-text"
      }`}
    >
      <input type="checkbox" name={name} className="hidden" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
      {checked ? "✓ " : ""}
      {label}
    </label>
  );
}

export function CreatePostForm() {
  const [state, formAction] = useActionState(createMediaPostAction, initial);
  const [format, setFormat] = useState("POST");
  const [category, setCategory] = useState("EVENT");
  const [caption, setCaption] = useState("");
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-[var(--radius-card)] border-2 border-primary bg-surface p-5">
      <div>
        <h2 className="text-base font-extrabold text-text">New post</h2>
        <p className="text-xs text-text-muted">Goes to the college app Explore feed</p>
      </div>

      <input type="hidden" name="format" value={format} />
      <div>
        <p className="mb-1.5 text-xs font-bold tracking-wide text-text-muted uppercase">Post format</p>
        <div className="flex flex-wrap gap-2">
          {FORMATS.map((f) => (
            <button
              type="button"
              key={f.value}
              onClick={() => setFormat(f.value)}
              className={`rounded-[var(--radius-input)] border px-3.5 py-2 text-sm font-bold ${
                format === f.value ? "border-primary bg-field text-primary" : "border-border text-text"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <input type="hidden" name="category" value={category} />
      <div>
        <p className="mb-1.5 text-xs font-bold tracking-wide text-text-muted uppercase">Post category</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`rounded-[var(--radius-input)] border px-3.5 py-2 text-sm font-bold ${
                category === c.value ? "border-primary bg-field text-primary" : "border-border text-text"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="caption" className="text-xs font-bold tracking-wide text-text-muted uppercase">Caption</label>
        <textarea
          id="caption"
          name="caption"
          rows={4}
          maxLength={2200}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write the caption. Mention the department, date, venue and the registration link."
          className="min-h-24 resize-y rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
        />
        <span className="text-xs text-text-muted">{caption.length} / 2200</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextField label="Publish date" name="publishDate" type="date" />
        <TextField label="Publish time" name="publishTime" type="time" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="First comment" name="firstComment" placeholder="Hashtags or credits posted as the first comment" />
        <TextField label="Link in post" name="linkUrl" type="url" placeholder="Registration or admissions link" />
      </div>

      <div className="flex flex-wrap gap-2">
        <ToggleChip label="Pin to top of Explore" name="pinToTop" />
        <ToggleChip label="Allow comments" name="allowComments" defaultChecked />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-bold tracking-wide text-text-muted uppercase">Creative</p>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-[var(--radius-input)] border-2 border-dashed border-border bg-field p-6 text-center"
        >
          <input
            ref={fileInputRef}
            type="file"
            name="files"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.avi,.mkv"
            className="hidden"
            onChange={(e) => setFileNames(Array.from(e.target.files ?? []).map((f) => f.name))}
          />
          <p className="text-sm text-text-muted">
            {fileNames.length > 0 ? fileNames.join(", ") : "Click to add photos / videos"}
          </p>
          <p className="mt-1 text-xs text-text-muted">Several files allowed — viewers swipe through them. First one is the cover.</p>
        </div>
      </div>

      <FieldError message={state.error} />

      <div className="flex justify-end gap-2">
        <PlainButton
          type="submit"
          variant="secondary"
          name="saveAsDraft"
          value="true"
          onClick={() => setSaveAsDraft(true)}
        >
          Save draft
        </PlainButton>
        <Button
          type="submit"
          variant="primary"
          name="saveAsDraft"
          value="false"
          pendingLabel={saveAsDraft ? "Saving…" : "Publishing…"}
        >
          Publish now
        </Button>
      </div>
    </form>
  );
}
