"use client";

import { useState, FormEvent } from "react";
import { createBooking } from "../../../lib/api";
import { useRouter } from "next/navigation";

interface BookingFormProps {
  event: {
    id: number;
    name: string;
    currentPrice: string;
    availableTickets: number;
  };
}

export default function BookingForm({ event }: BookingFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await createBooking({
        eventId: event.id,
        userEmail: email,
        quantity,
      });

      // Redirect to success page
      router.push(`/bookings/success?bookingId=${result.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create booking");
      setLoading(false);
    }
  };

  const maxQuantity = Math.min(10, event.availableTickets);
  const totalPrice = Number(event.currentPrice) * quantity;

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-8">
      <h2 className="text-2xl font-light text-slate-100 mb-6">Book Tickets</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="your.email@example.com"
          />
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-slate-300 mb-2">
            Quantity
          </label>
          <select
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4 border-t border-slate-700/50">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-300">Price per ticket</span>
            <span className="text-xl font-light text-slate-100">
              ${Number(event.currentPrice).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="text-slate-100 font-medium">Total</span>
            <span className="text-2xl font-light text-green-400">${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          {loading ? "Processing..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}

