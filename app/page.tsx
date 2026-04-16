import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function Home() {
  const [totalRoundParticipations, totalOvertimeParticipations, evanRoundParticipations, evanOvertimeParticipations] = await Promise.all([
    prisma.roundPlayer.count({
      where: {
        round: { status: "COMPLETED" },
        player: { name: { not: "Evan" } },
      },
    }),
    prisma.raceResult.count({
      where: {
        player: { name: { not: "Evan" } },
        race: {
          isOvertime: true,
          round: { status: "COMPLETED" },
        },
      },
    }),
    prisma.roundPlayer.count({
      where: {
        round: { status: "COMPLETED" },
        player: { name: "Evan" },
      },
    }),
    prisma.raceResult.count({
      where: {
        player: { name: "Evan" },
        race: {
          isOvertime: true,
          round: { status: "COMPLETED" },
        },
      },
    }),
  ]);

  const totalBeers = totalRoundParticipations * 2 + totalOvertimeParticipations;
  const evanBeers = evanRoundParticipations * 2 + evanOvertimeParticipations;

  return (
    <main className="min-h-screen checkered-bg flex flex-col items-center justify-center gap-8 p-4">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-5xl sm:text-6xl font-black rainbow-text drop-shadow-lg mb-2">
          BEERIO KART
        </h1>
        <p className="text-2xl sm:text-3xl font-bold text-white tracking-wider"
           style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.5)" }}>
          STATS TRACKER
        </p>
      </div>

      {/* Menu buttons */}
      <div className="flex flex-col gap-4 w-full max-w-md">
        <Link
          href="/leaderboard"
          className="mk-button mk-button-yellow px-8 py-5 text-xl text-center flex items-center justify-center gap-3"
        >
          <span className="text-2xl">🏆</span>
          Leaderboard
        </Link>
        <Link
          href="/players"
          className="mk-button mk-button-green px-8 py-5 text-xl text-center flex items-center justify-center gap-3"
        >
          <span className="text-2xl">👤</span>
          Players
        </Link>
        <Link
          href="/enter"
          className="mk-button mk-button-blue px-8 py-5 text-xl text-center flex items-center justify-center gap-3"
        >
          <span className="text-2xl">🏁</span>
          Enter Round
        </Link>
        <Link
          href="/admin"
          className="mk-button px-8 py-5 text-xl text-center flex items-center justify-center gap-3"
        >
          <span className="text-2xl">⚙️</span>
          Admin
        </Link>
      </div>

      {/* Beer Counter */}
      <div className="mk-card px-8 py-4 text-center">
        <p className="text-xl font-bold text-white">
          🍺 Beers Consumed: {totalBeers}
        </p>
      </div>

      {/* Evan's Beer Counter */}
      <div className="mk-card px-8 py-4 text-center">
        <p className="text-xl font-bold text-white">
          🧃 Pussy Bitch Surfsides Consumed: {evanBeers}
        </p>
      </div>

    </main>
  );
}
