import Link from "next/link";
import { ArrowRight, Wallet, GitPullRequest, CircleCheck } from "lucide-react";

export const metadata = {
  title: "Budget Lock & Self-Repair — RaksHex",
  description: "RaksHex is validating two workflows: AI/API cost visibility and advisory budgets, plus change detection and human-reviewed API repair.",
  alternates: { canonical: "/features" },
};

const products = [
  {
    id: "budget-lock",
    name: "Budget Lock",
    icon: Wallet,
    status: "Commercial hypothesis · not production-proven",
    description: "Understand AI/API usage, forecast costs and review budgets before surprises turn into bills.",
    workflow: ["Record usage and estimated cost", "Forecast likely spend", "Compare the forecast with a team budget", "Alert a human to review overages"],
    boundary: "Advisory tracking and alerts only. We do not claim a working universal hard cap or live enforcement across providers.",
  },
  {
    id: "self-repair",
    name: "Self-Repair",
    icon: GitPullRequest,
    status: "Controlled Stripe example · end-to-end integration in progress",
    description: "Detect upstream breaking changes, trace affected code and prepare a proposed fix with test evidence.",
    workflow: ["Detect an API or SDK change", "Find the affected code location", "Propose a targeted fix and run tests", "Show evidence for human approval before merge"],
    boundary: "The Stripe fixture is internally validated (two TypeScript errors before, zero after; six fixture tests passing). This does not prove production repair or broad provider coverage.",
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-transparent text-white pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-14">
          <p className="text-[#14B8A6] uppercase font-mono text-xs tracking-widest mb-4">RaksHex product focus</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Two workflows. Real evidence. No extra products.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">RaksHex is building for teams that need to understand AI/API costs and respond to broken integrations. Both workflows are early-stage and neither is a production-proven product.</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          {products.map((product) => {
            const Icon = product.icon;
            return (
              <section id={product.id} key={product.id} className="scroll-mt-32 rounded-2xl border border-[#14B8A6]/25 bg-[#0B0F17]/70 p-7 md:p-9">
                <Icon className="h-9 w-9 text-[#14B8A6] mb-5" aria-hidden="true" />
                <span className="font-mono text-xs text-[#14B8A6]">{product.status}</span>
                <h2 className="text-3xl font-bold mt-3 mb-4">{product.name}</h2>
                <p className="text-neutral-300 leading-relaxed">{product.description}</p>
                <h3 className="font-semibold text-lg mt-7 mb-4">Intended workflow</h3>
                <ol className="space-y-4">
                  {product.workflow.map((step, i) => (
                    <li key={step} className="flex items-start gap-3 text-neutral-300 text-sm"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#14B8A6]/40 text-[#14B8A6] font-bold">{i + 1}</span><span className="pt-1">{step}</span></li>
                  ))}
                </ol>
                <div className="mt-8 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-xs font-semibold text-amber-200 mb-1">Current limit</p>
                  <p className="text-sm text-neutral-400 leading-relaxed">{product.boundary}</p>
                </div>
              </section>
            );
          })}
        </div>
        <section className="border-t border-white/10 mt-14 pt-12 max-w-3xl">
          <div className="flex gap-3 items-start mb-5"><CircleCheck className="text-[#14B8A6] w-6 h-6 shrink-0" /><p className="text-neutral-300">Failure, testing and cost logs support these two workflows. We are not creating a third guardrail or monitoring product.</p></div>
          <h2 className="text-2xl font-bold mb-3">Help decide which becomes the first paid product.</h2>
          <p className="text-neutral-400 mb-6">Our next milestone is five genuine design partners to validate the problems, technical outcomes and willingness to pay.</p>
          <Link href="/waitlist" className="inline-flex items-center gap-2 bg-[#14B8A6] text-[#07100f] rounded-lg py-3 px-5 font-semibold hover:bg-[#2dd4bf] transition-colors">Discuss a design partnership <ArrowRight className="w-4 h-4" /></Link>
        </section>
      </div>
    </main>
  );
}
