import { redirect } from "next/navigation";

// Retired marketing experiment: point visitors to the current homepage.
export default function LandingPage() {
  redirect("/");
}
