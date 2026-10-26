import Link from "next/link";
import { Wallet, GitPullRequest } from "lucide-react";

const cards = [
  {
    id: "budget-lock",
    title: "Budget Lock",
    tag: "Revenue hypothesis · validation stage",
    icon: Wallet,
    description: "Understand usage, estimate spend and review budget alerts across AI/API workloads. Hard caps are not yet established across providers.",
    details: ["Usage and cost records", "Spend forecasting", "Advisory budget alerts"],
  },
  {
    id: "self-repair",
    title: "Self-Repair",
    tag: "Technical proof · controlled example",
    icon: GitPullRequest,
    description: "Identify changes in upstream APIs, map affected code, suggest fixes and check them with tests before a developer approves.",
    details: ["Change-to-code mapping", "Proposed repair with test evidence", "Human approval before adoption"],
  },
];

export function FeatureCards() {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-[#14B8A6] text-xs font-semibold tracking-widest uppercase mb-3">Two workflows · One focused product direction</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Built around two costly problems</h2>
        <p className="text-[#9CA3AF]">Test, failure and cost logs live inside these workflows — they are not a third product.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article id={card.id} key={card.id} className="scroll-mt-32 bg-[#0B0F17]/65 border border-[#14B8A6]/20 hover:border-[#14B8A6]/50 rounded-xl p-7 transition-all duration-200 hover:-translate-y-1 motion-reduce:transform-none">
              <Icon className="w-8 h-8 text-[#14B8A6] mb-5" aria-hidden="true" />
              <span className="text-[11px] font-mono text-[#14B8A6]">{card.tag}</span>
              <h3 className="text-white font-semibold text-2xl mt-2 mb-3">{card.title}</h3>
              <p className="text-[#9CA3AF] leading-relaxed mb-5">{card.description}</p>
              <ul className="space-y-2 text-sm text-neutral-300">
                {card.details.map((d) => <li key={d} className="flex items-start gap-2"><span className="text-[#14B8A6]">•</span>{d}</li>)}
              </ul>
              <Link href="/features" className="text-[#14B8A6] font-semibold text-sm inline-block mt-6 hover:underline">Explore workflow →</Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
