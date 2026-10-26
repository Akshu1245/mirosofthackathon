"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

type Workflow = "budget" | "repair";

const EXAMPLES: Record<Workflow, { title: string; status: string; lines: string[]; steps: string[] }> = {
  budget: {
    title: "Budget Lock · Illustrative preview",
    status: "Advisory · not a provider-enforced cap",
    lines: [
      "> sample monthly budget: $500",
      "> sample recorded spend: $340",
      "> sample projected spend: $520",
      "> forecast exceeds the target by $20",
      "> review usage and adjust before the bill",
    ],
    steps: ["Record usage", "Forecast spend", "Compare with target", "Review advisory alert"],
  },
  repair: {
    title: "Self-Repair · Controlled test",
    status: "Stripe fixture · not production automation",
    lines: [
      "> Stripe SDK/API change identified",
      "> affected reference: payment_method_types",
      "> TypeScript errors before: 2",
      "> TypeScript errors after: 0",
      "> fixture tests: 6/6 passed · human review required",
    ],
    steps: ["Detect change", "Locate affected code", "Validate proposed fix", "Require human approval"],
  },
};

export function TerminalDemo() {
  const [workflow, setWorkflow] = useState<Workflow>("repair");
  const [step, setStep] = useState(0);
  const example = EXAMPLES[workflow];

  useEffect(() => {
    // Keep a useful, readable static example when motion is reduced.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(EXAMPLES[workflow].lines.length);
      return;
    }
    setStep(0);
    let index = 0;
    const interval = window.setInterval(() => {
      index = (index + 1) % (EXAMPLES[workflow].lines.length + 1);
      setStep(index);
    }, 1250);
    return () => window.clearInterval(interval);
  }, [workflow]);

  return (
    <div className="w-full max-w-[640px] rounded-lg border border-[#14B8A6]/60 bg-[#0B0F17]/60 flex flex-col gap-4 p-5 shadow-[0_12px_50px_rgba(20,184,166,0.08)]">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose example workflow">
        <button type="button" onClick={() => setWorkflow("budget")} aria-pressed={workflow === "budget"}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${workflow === "budget" ? "bg-[#14B8A6] text-[#07100f]" : "border border-white/20 text-neutral-300 hover:border-[#14B8A6]"}`}>
          Budget Lock
        </button>
        <button type="button" onClick={() => setWorkflow("repair")} aria-pressed={workflow === "repair"}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${workflow === "repair" ? "bg-[#14B8A6] text-[#07100f]" : "border border-white/20 text-neutral-300 hover:border-[#14B8A6]"}`}>
          Self-Repair
        </button>
      </div>
      <div className="bg-black/45 rounded border border-[#14B8A6]/20 p-4 font-mono text-xs min-h-[218px]">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
          <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
          <span className="text-[#9CA3AF]">{example.title}</span>
        </div>
        <div className="space-y-3" aria-live="off">
          {example.lines.map((line, i) => (
            <p key={line} className={`transition-opacity duration-300 motion-reduce:transition-none ${i < step ? "opacity-100 text-neutral-200" : "opacity-20 text-neutral-500"}`}>{line}</p>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {example.steps.map((stage, i) => (
          <div key={stage} className={`flex items-start gap-2 rounded border p-2.5 text-[11px] transition-colors ${i < step ? "border-[#14B8A6]/40 bg-[#14B8A6]/5 text-white" : "border-white/10 text-neutral-500"}`}>
            {i < step ? <CheckCircle2 className="w-4 h-4 text-[#14B8A6] shrink-0" /> : <Circle className="w-4 h-4 shrink-0" />}
            <span>{stage}</span>
          </div>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-[#9CA3AF]">
        <ArrowRight className="inline w-3 h-3 text-[#14B8A6] mr-1" />{example.status}. This visual does not send API requests or enforce spending limits.
      </p>
    </div>
  );
}
