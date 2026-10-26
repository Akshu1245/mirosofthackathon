import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing Status — RaksHex",
  description: "RaksHex is validating Budget Lock and Self-Repair with design partners. No public production subscription or confirmed pricing yet.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing Status — RaksHex",
    description: "Help validate willingness to pay for AI/API cost control and human-reviewed API repairs.",
    url: "https://rakshex.in/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) { return children; }
