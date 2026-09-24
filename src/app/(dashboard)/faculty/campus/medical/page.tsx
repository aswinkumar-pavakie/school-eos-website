// Medical -- book a medical appointment and see your bookings (mobile: Campus > Medical).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listMedicalAppointments, type MedicalAppointment } from "@/lib/campus-api";
import { CampusScreen } from "../CampusScreen";
import { CampusRequestForm } from "../CampusRequestForm";
import { createMedicalAction } from "../actions";

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function MedicalPage() {
  let appointments: MedicalAppointment[];
  try {
    appointments = await listMedicalAppointments();
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your appointments. Nothing was changed -- try again." />;
  }

  return (
    <CampusScreen
      title="Medical"
      subtitle="Book a medical appointment"
      formTitle="Book an appointment"
      emptyText="No appointments yet."
      history={appointments.map((a) => ({
        id: a.id,
        title: a.reason,
        subtitle: `${formatDay(a.preferredDate)}${a.preferredTime ? ` · ${a.preferredTime}` : ""}`,
        status: a.status,
      }))}
      form={
        <CampusRequestForm
          action={createMedicalAction}
          submitLabel="Submit request"
          successText="Appointment requested"
          fields={[
            { name: "preferredDate", label: "Preferred date", kind: "date", required: true },
            { name: "preferredTime", label: "Preferred time (optional)", kind: "text", placeholder: "e.g. 2:00 PM" },
            { name: "reason", label: "Reason", kind: "textarea", placeholder: "e.g. Fever, general checkup", required: true },
          ]}
        />
      }
    />
  );
}
