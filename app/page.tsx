import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-4xl font-bold text-center">Mario Kart Stats Tracker</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/enter"
          className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-lg text-center transition-colors"
        >
          Enter Round
        </Link>
        <Link
          href="/admin"
          className="px-8 py-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-semibold text-lg text-center transition-colors"
        >
          Admin
        </Link>
      </div>
    </main>
  );
}
