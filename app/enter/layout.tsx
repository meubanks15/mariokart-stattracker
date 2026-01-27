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
    { label: "Players", path: "/enter", active: pathname === "/enter" },
    { label: "Race 1", path: "/enter/race/1", active: pathname === "/enter/race/1" },
    { label: "Race 2", path: "/enter/race/2", active: pathname === "/enter/race/2" },
    { label: "Race 3", path: "/enter/race/3", active: pathname === "/enter/race/3" },
    { label: "Race 4", path: "/enter/race/4", active: pathname === "/enter/race/4" },
    { label: "Summary", path: "/enter/summary", active: pathname === "/enter/summary" },
  ];

  // Find current step index
  const currentIndex = steps.findIndex((s) => s.active);

  return (
    <div className="flex items-center justify-center gap-2 py-4 overflow-x-auto">
      {steps.map((step, index) => {
        const isComplete = currentIndex > index;
        const isCurrent = index === currentIndex;
        const canNavigate = isComplete && roundId;

        const content = (
          <div
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${isCurrent
                ? "bg-blue-500 text-white"
                : isComplete
                  ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }
            `}
          >
            {isComplete && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span>{step.label}</span>
          </div>
        );

        return (
          <div key={step.path} className="flex items-center gap-2">
            {index > 0 && (
              <div className={`w-4 h-0.5 ${isComplete || isCurrent ? "bg-blue-300" : "bg-gray-300 dark:bg-gray-600"}`} />
            )}
            {canNavigate ? (
              <Link href={`${step.path}?roundId=${roundId}`}>{content}</Link>
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
    <Suspense fallback={<div className="py-4 text-center text-gray-500">Loading...</div>}>
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
    <div className="min-h-screen">
      <header className="border-b dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="text-xl font-bold">
              MK Stats
            </Link>
            <h1 className="text-lg font-semibold">Enter Round</h1>
          </div>
          <ProgressStepper />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
