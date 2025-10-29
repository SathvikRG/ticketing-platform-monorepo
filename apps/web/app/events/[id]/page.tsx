import { fetchEvent } from "../../../lib/api";
import Link from "next/link";
import BookingForm from "./booking-form";
import PricePolling from "./price-polling";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await fetchEvent(parseInt(id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to Events
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-16">
        <div className="space-y-8">
          {/* Event Info */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-8 space-y-6">
            <div>
              <h1 className="text-4xl font-light text-slate-100 mb-4">{event.name}</h1>
              <div className="flex flex-wrap gap-4 text-slate-400">
                <span>
                  📅{" "}
                  {new Date(event.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span>📍 {event.venue}</span>
              </div>
            </div>

            {event.description && (
              <p className="text-slate-300 leading-relaxed">{event.description}</p>
            )}
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-8 space-y-6">
            <h2 className="text-2xl font-light text-slate-100">Pricing Breakdown</h2>

            <PricePolling eventId={event.id} />

            <div className="space-y-4 pt-4 border-t border-slate-700/50">
              <div className="flex justify-between text-slate-300">
                <span>Base Price</span>
                <span className="font-light">${Number(event.basePrice).toFixed(2)}</span>
              </div>

              {event.priceAdjustments && event.priceAdjustments.length > 0 && (
                <div className="space-y-2 pl-4">
                  {event.priceAdjustments.map((adjustment, index) => (
                    <div key={index} className="flex justify-between text-sm text-slate-400">
                      <span>{adjustment.rule.replace(/-/g, " ")} (+{adjustment.adjustment * 100}%)</span>
                      <span>${adjustment.adjustedPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between text-lg font-light text-green-400 pt-2 border-t border-slate-700/50">
                <span>Current Price</span>
                <span>${Number(event.currentPrice).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-4 text-sm text-slate-400">
              <span>Price Range: ${Number(event.floorPrice).toFixed(2)} - ${Number(event.ceilingPrice).toFixed(2)}</span>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-light text-slate-100">Availability</h3>
                <p className="text-slate-400 text-sm mt-1">
                  {event.availableTickets} tickets remaining
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Sold</p>
                <p className="text-2xl font-light text-slate-200">
                  {((event.bookedTickets / event.totalTickets) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${(event.bookedTickets / event.totalTickets) * 100}%` }}
              />
            </div>
          </div>

          {/* Booking Form */}
          {event.availableTickets > 0 ? (
            <BookingForm event={event} />
          ) : (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
              <p className="text-red-300">This event is sold out</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

