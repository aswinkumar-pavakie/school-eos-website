// Food Court -- place an order and see your orders (mobile: Campus > Food Court).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listFoodOrders, type FoodOrder } from "@/lib/campus-api";
import { CampusScreen } from "../CampusScreen";
import { CampusRequestForm } from "../CampusRequestForm";
import { createFoodOrderAction } from "../actions";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function FoodCourtPage() {
  let orders: FoodOrder[];
  try {
    orders = await listFoodOrders();
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your food orders. Nothing was changed -- try again." />;
  }

  return (
    <CampusScreen
      title="Food court"
      subtitle="Order from the campus food court"
      formTitle="Place an order"
      emptyText="No orders yet."
      history={orders.map((o) => ({
        id: o.id,
        title: o.items,
        subtitle: `${formatWhen(o.createdAt)}${o.pickupTime ? ` · pickup ${o.pickupTime}` : ""}${o.notes ? ` · ${o.notes}` : ""}`,
        status: o.status,
      }))}
      form={
        <CampusRequestForm
          action={createFoodOrderAction}
          submitLabel="Submit order"
          successText="Order placed"
          fields={[
            { name: "items", label: "What would you like?", kind: "textarea", placeholder: "e.g. 2 veg sandwiches, 1 tea", required: true },
            { name: "pickupTime", label: "Pickup time (optional)", kind: "text", placeholder: "e.g. 1:15 PM" },
            { name: "notes", label: "Notes (optional)", kind: "text", placeholder: "Anything the counter should know" },
          ]}
        />
      }
    />
  );
}
