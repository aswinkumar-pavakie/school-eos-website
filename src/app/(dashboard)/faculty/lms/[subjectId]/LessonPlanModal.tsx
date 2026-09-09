"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { LmsLessonPlan } from "@/lib/faculty-lms-api";
import { createLessonPlanAction, updateLessonPlanAction, type FormState } from "../actions";

const initial: FormState = {};

export function LessonPlanModal({ subjectOfferingId, plan }: { subjectOfferingId: string; plan?: LmsLessonPlan }) {
  const action = plan ? updateLessonPlanAction.bind(null, plan.id) : createLessonPlanAction.bind(null, subjectOfferingId);
  const [state, formAction] = useActionState(action, initial);

  return (
    <Modal title={plan ? "Edit lesson plan" : "New lesson plan"} trigger={<PlainButton variant={plan ? "secondary" : "primary"}>{plan ? "Edit" : "+ New lesson plan"}</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Title" name="title" placeholder="e.g. Week 3 — Photosynthesis" defaultValue={plan?.title} required />
        <TextField label="Week of (optional)" name="weekStart" type="date" defaultValue={plan?.weekStart?.slice(0, 10) ?? ""} />
        <TextAreaField label="Content" name="content" rows={6} defaultValue={plan?.content} required />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…">{plan ? "Save changes" : "Create lesson plan"}</Button>
      </form>
    </Modal>
  );
}
