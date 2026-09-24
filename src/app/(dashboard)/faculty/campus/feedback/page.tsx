// Feedback -- share feedback about campus and see what you have sent (mobile: Campus > Feedback).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listFeedback, type Feedback } from "@/lib/campus-api";
import { CampusScreen } from "../CampusScreen";
import { CampusRequestForm } from "../CampusRequestForm";
import { createFeedbackAction } from "../actions";

const CATEGORIES = [
  { value: "FACILITIES", label: "Facilities" },
  { value: "FOOD", label: "Food" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "SAFETY", label: "Safety" },
  { value: "OTHER", label: "Other" },
];

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function FeedbackPage() {
  let items: Feedback[];
  try {
    items = await listFeedback();
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your feedback. Nothing was changed -- try again." />;
  }

  return (
    <CampusScreen
      title="Feedback"
      subtitle="Share feedback about campus"
      formTitle="Share feedback"
      emptyText="No feedback submitted yet."
      history={items.map((f) => ({ id: f.id, title: f.message, subtitle: formatWhen(f.createdAt), tag: f.category }))}
      form={
        <CampusRequestForm
          action={createFeedbackAction}
          submitLabel="Submit feedback"
          successText="Feedback submitted"
          fields={[
            { name: "category", label: "Category", kind: "select", options: CATEGORIES, required: true },
            { name: "message", label: "Message", kind: "textarea", placeholder: "Tell us what is on your mind...", required: true },
          ]}
        />
      }
    />
  );
}
