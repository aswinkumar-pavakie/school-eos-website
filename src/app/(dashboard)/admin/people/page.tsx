import { redirect } from "next/navigation";

// Superseded by the three separate top-level routes (Students, Parents, Faculty)
// per the Design Architecture v0.1 nav order -- kept as a redirect so any existing
// link to the old stub path still lands somewhere useful.
export default function Page() {
  redirect("/admin/students");
}
