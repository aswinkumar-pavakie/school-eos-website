import { redirect } from "next/navigation";
import { AuthExpiredError } from "@/lib/api";
import { getLibraryConfig } from "@/lib/library-api";
import { ConfigurationForm } from "./ConfigurationForm";

export default async function LibraryConfigurationPage() {
  try {
    const config = await getLibraryConfig();

    return (
      <div className="mx-auto max-w-[600px]">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Configuration</h1>
          <p className="mt-1 text-sm text-text-muted">Circulation, fine, and reservation rules for the whole Library.</p>
        </div>

        <div className="mt-6">
          <ConfigurationForm config={config} />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Library configuration</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
