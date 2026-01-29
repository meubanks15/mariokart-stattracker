"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ProgressStepperInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const roundId = searchParams.get("roundId");

  // Determine current step
  const steps = [
    { label: "Players", path: "/enter", emoji: "👥" },
    { label: "Race 1", path: "/enter/race/1", emoji: "1️⃣" },
    { label: "Race 2", path: "/enter/race/2", emoji: "2️⃣" },
    { label: "Race 3", path: "/enter/race/3", emoji: "3️⃣" },
    { label: "Race 4", path: "/enter/race/4", emoji: "4️⃣" },
    { label: "Finish", path: "/enter/summary", emoji: "🏁" },
  ];

  // Find current step index
  const currentIndex = steps.findIndex((s) => pathname === s.path || pathname.startsWith(s.path + "/"));

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 py-4 overflow-x-auto px-2">
      {steps.map((step, index) => {
        const isComplete = currentIndex > index;
        const isCurrent = index === currentIndex;
        const canNavigate = isComplete && roundId;

        const content = (
          <div
            className={`
              flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all
              ${isCurrent
                ? "bg-gradient-to-b from-blue-400 to-blue-600 text-white border-2 border-blue-300 shadow-lg"
                : isComplete
                  ? "bg-gradient-to-b from-green-400 to-green-600 text-white border-2 border-green-300"
                  : "bg-gradient-to-b from-gray-600 to-gray-700 text-gray-400 border-2 border-gray-500"
              }
            `}
            style={{
              boxShadow: isCurrent ? "0 4px 0 #1e40af, 0 6px 10px rgba(0,0,0,0.3)" :
                         isComplete ? "0 3px 0 #166534" : "0 3px 0 #374151"
            }}
          >
            <span className="text-base sm:text-lg">{isComplete ? "✓" : step.emoji}</span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
        );

        return (
          <div key={step.path} className="flex items-center gap-1 sm:gap-2">
            {index > 0 && (
              <div className={`w-2 sm:w-6 h-1 rounded-full ${
                isComplete ? "bg-green-400" :
                isCurrent ? "bg-blue-400" : "bg-gray-600"
              }`} />
            )}
            {canNavigate ? (
              <Link href={`${step.path}?roundId=${roundId}`} className="hover:scale-105 transition-transform">
                {content}
              </Link>
            ) : (
              content
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProgressStepper() {
  return (
    <Suspense fallback={
      <div className="py-4 flex justify-center">
        <div className="text-gray-400 font-bold">Loading...</div>
      </div>
    }>
      <ProgressStepperInner />
    </Suspense>
  );
}

export default function EnterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen checkered-bg">
      <header className="mk-header">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="text-xl font-bold text-white"
                  style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
              MK Stats
            </Link>
            <h1 className="text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2"
                style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
              <span>🏎️</span> Grand Prix
            </h1>
          </div>
        </div>
      </header>

      {/* Progress stepper */}
      <div className="bg-gradient-to-b from-gray-900/50 to-transparent border-b border-gray-700/50">
        <div className="max-w-4xl mx-auto">
          <ProgressStepper />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
