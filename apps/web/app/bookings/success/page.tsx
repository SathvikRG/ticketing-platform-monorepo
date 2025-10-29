import { redirect } from "next/navigation";

export default async function BookingSuccessPage({ searchParams }: { searchParams: Promise<{ bookingId?: string }> }) {
  const params = await searchParams;

  if (!params.bookingId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-light tracking-tight text-slate-100">
            Event Ticketing Platform
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-8 py-16">
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 mb-4">
              <svg
                className="w-8 h-8 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-light text-slate-100 mb-2">Booking Confirmed!</h2>
            <p className="text-slate-400">
              Your booking has been successfully processed. Booking ID: {params.bookingId}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-700/50">
            <p className="text-slate-300 mb-4">
              A confirmation email has been sent to your email address. Please save your booking ID
              for your records.
            </p>
          </div>

          <div className="flex gap-4 pt-6 border-t border-slate-700/50">
            <a
              href="/my-bookings"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-center"
            >
              View My Bookings
            </a>
            <a
              href="/"
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-colors text-center"
            >
              Back to Events
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

