import Link from "next/link";
import { fetchEvents } from "../../lib/api";

export default async function EventsPage() {
  const events = await fetchEvents();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-light tracking-tight text-slate-100">
              Event Ticketing Platform
            </h1>
            <Link
              href="/my-bookings"
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              My Bookings
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-light text-slate-100 mb-2">Upcoming Events</h2>
            <p className="text-slate-400">Dynamic pricing applied in real-time</p>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 text-lg">No events available</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group bg-slate-800/40 border border-slate-700/50 rounded-lg p-6 hover:bg-slate-800/60 hover:border-slate-600 transition-all duration-300"
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-light text-slate-100 mb-2 group-hover:text-white transition-colors">
                        {event.name}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {new Date(event.date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-slate-500 text-sm mt-1">{event.venue}</p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-700/50">
                      <div>
                        <p className="text-sm text-slate-400">Price</p>
                        <p className="text-2xl font-light text-green-400">
                          ${Number(event.currentPrice).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Available</p>
                        <p className="text-lg font-light text-slate-200">
                          {event.availableTickets} tickets
                        </p>
                      </div>
                    </div>

                    {event.availableTickets === 0 && (
                      <div className="pt-2">
                        <span className="inline-block px-3 py-1 text-xs bg-red-500/20 text-red-300 rounded-full border border-red-500/30">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

