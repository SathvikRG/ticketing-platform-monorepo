import { fetchEvents } from "../../lib/api";
import { cookies } from "next/headers";

export default async function MyBookingsPage() {
  // For demonstration, we'll show a placeholder
  // In a real app, we'd get the user's email from authentication
  const userEmail = "user@example.com"; // Placeholder

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-light tracking-tight text-slate-100">
              My Bookings
            </h1>
            <a
              href="/"
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to Events
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-16">
        <div className="space-y-8">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-8">
            <h2 className="text-2xl font-light text-slate-100 mb-6">Your Bookings</h2>

            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-300">
                  <strong>Note:</strong> In a production app, this would fetch your bookings by
                  email. For now, enter your email on any event detail page to make a booking and
                  view it here.
                </p>
              </div>

              <p className="text-slate-400 text-center py-8">
                No bookings found. Go to an event and make a booking to get started!
              </p>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-lg font-light text-slate-100 mb-4">How it works</h3>
            <ul className="space-y-2 text-slate-400">
              <li>• Browse events and select tickets you want to book</li>
              <li>• Prices update in real-time based on demand and availability</li>
              <li>• Complete your booking with your email address</li>
              <li>• View your booking history here</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

