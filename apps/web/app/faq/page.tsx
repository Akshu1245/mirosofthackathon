import Link from "next/link";

export const metadata = {
  title: "Frequently Asked Questions — RaksHex",
  description: "Answers about Budget Lock, Self-Repair, pilot readiness and RaksHex's current evidence.",
  alternates: { canonical: "/faq" },
};

const FAQS = [
  { q: "What does RaksHex build?", a: "Two workflows: Budget Lock for AI/API spending visibility, forecasting and advisory alerts; and Self-Repair for detecting breaking API changes, proposing tested fixes and requiring human approval." },
  { q: "Is Budget Lock a guaranteed hard spending cap?", a: "No. Cross-provider enforcement has not been proven. We are validating advisory budgeting as a potential paid workflow, not promising that an API provider will stop billing at a threshold." },
  { q: "Which providers can you connect today?", a: "Provider coverage depends on the individual integration and is still under development. Our site does not claim universal multi-provider readiness. Please contact us with the provider and workflow you need tested." },
  { q: "What is the Self-Repair evidence?", a: "An internal, controlled Stripe SDK/API change example identifies an affected TypeScript reference. The fixture went from two TypeScript errors before to zero after, with six fixture tests passing. End-to-end deployment and general repair reliability are not proven." },
  { q: "Does Self-Repair merge code without approval?", a: "No. Human approval is part of the intended workflow. Suggestions and tests are evidence for a developer, not authority to automatically merge or deploy." },
  { q: "Do you offer production security enforcement or an Agent Firewall?", a: "Our current product focus does not include a separate guardrail-monitoring or Agent Firewall offering. Logs and security checks, where appropriate, support Budget Lock and Self-Repair." },
  { q: "Are you accepting paying customers?", a: "RaksHex is pre-revenue and currently validating the customer problem and willingness to pay. We have no published production plans or proven subscriptions for these workflows." },
  { q: "How can my team become a design partner?", a: "Share your work email through our design partner form or write to akshay@rakshex.in. We want to understand a real cost incident or integration breakage, review your requirements, and discuss a scoped test. No obligation is implied." },
  { q: "What will determine the primary product?", a: "Evidence from five genuine design partners: past incidents, tested technical outcomes, urgency and actual willingness to pay. Feature count is not the milestone." },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-transparent text-white pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-[#14B8A6] text-xs tracking-widest font-semibold uppercase mb-3">Current product scope</p>
        <h1 className="text-4xl font-bold mb-4">Frequently asked questions</h1>
        <p className="text-neutral-400 max-w-2xl mb-10">What is tested, what is planned, and how your team can help validate RaksHex.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FAQS.map((faq) => (
            <article key={faq.q} className="rounded-xl border border-[#14B8A6]/20 bg-[#0B0F17]/60 p-6 hover:border-[#14B8A6]/45 transition-colors">
              <h2 className="font-semibold text-lg text-white mb-3">{faq.q}</h2>
              <p className="text-neutral-400 text-sm leading-relaxed">{faq.a}</p>
            </article>
          ))}
        </div>
        <p className="mt-10 text-neutral-400 text-sm">Have a specific integration or incident? <Link href="/waitlist" className="text-[#14B8A6] hover:underline">Discuss a design partnership →</Link></p>
      </div>
    </main>
  );
}
