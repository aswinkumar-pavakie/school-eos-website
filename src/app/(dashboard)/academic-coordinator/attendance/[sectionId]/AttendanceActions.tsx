"use client";

import { useTransition } from "react";
import { useFlash } from "@/components/academic-coordinator-ui/FlashContext";
import { PrimaryButton, SecondaryButton } from "@/components/academic-coordinator-ui/primitives";
import { markAllPresentAction, publishAttendanceAction } from "./actions";

export function AttendanceActions({ sectionId, date, isLocked }: { sectionId: string; date: string; isLocked: boolean }) {
  const [pending, startTransition] = useTransition();
  const { showFlash } = useFlash();

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {!isLocked && (
        <SecondaryButton
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await markAllPresentAction(sectionId, date);
              showFlash("Marked all present.");
            })
          }
        >
          Mark all present
        </SecondaryButton>
      )}
      <PrimaryButton
        type="button"
        disabled={pending || isLocked}
        onClick={() =>
          startTransition(async () => {
            await publishAttendanceAction(sectionId, date);
            showFlash("Published.");
          })
        }
      >
        {isLocked ? "Published" : pending ? "Publishing…" : "Publish"}
      </PrimaryButton>
    </div>
  );
}
