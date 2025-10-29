"use client";

import { useEffect, useState } from "react";
import { fetchEvent } from "../../../lib/api";

interface PricePollingProps {
  eventId: number;
}

export default function PricePolling({ eventId }: PricePollingProps) {
  const [currentPrice, setCurrentPrice] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updatePrice = async () => {
      try {
        const event = await fetchEvent(eventId);
        setCurrentPrice(event.currentPrice);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching price:", error);
        setLoading(false);
      }
    };

    // Initial fetch
    updatePrice();

    // Poll every 30 seconds
    const interval = setInterval(updatePrice, 30000);

    return () => clearInterval(interval);
  }, [eventId]);

  return (
    <div className="flex items-center gap-4 pb-4 border-b border-slate-700/50">
      <span className="text-slate-300">Current Price</span>
      {loading ? (
        <span className="text-slate-500">Loading...</span>
      ) : (
        <span className="text-3xl font-light text-green-400">
          ${Number(currentPrice).toFixed(2)}
        </span>
      )}
      <span className="text-xs text-slate-500">Updates every 30s</span>
    </div>
  );
}

