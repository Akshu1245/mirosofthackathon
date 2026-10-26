import { redirect } from "next/navigation";

// The earlier Agent Firewall overview is no longer the product direction.
export default function OverviewPage() {
  redirect("/features");
}
