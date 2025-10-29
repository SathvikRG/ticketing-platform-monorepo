const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Event {
  id: number;
  name: string;
  date: string;
  venue: string;
  description: string;
  totalTickets: number;
  bookedTickets: number;
  basePrice: string;
  currentPrice: string;
  floorPrice: string;
  ceilingPrice: string;
  availableTickets: number;
  priceAdjustments?: Array<{
    rule: string;
    adjustment: number;
    adjustedPrice: number;
  }>;
}

interface Booking {
  id: number;
  eventId: number;
  userEmail: string;
  quantity: number;
  pricePaid: string;
  bookingTimestamp: string;
}

interface CreateBookingRequest {
  eventId: number;
  userEmail: string;
  quantity: number;
}

export async function fetchEvents(): Promise<Event[]> {
  const response = await fetch(`${API_BASE_URL}/events`);
  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }
  return response.json();
}

export async function fetchEvent(id: number): Promise<Event> {
  const response = await fetch(`${API_BASE_URL}/events/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch event");
  }
  return response.json();
}

export async function createBooking(data: CreateBookingRequest): Promise<Booking> {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create booking");
  }

  return response.json();
}

export async function fetchBookings(eventId?: number): Promise<Booking[]> {
  const url = eventId ? `${API_BASE_URL}/bookings?eventId=${eventId}` : `${API_BASE_URL}/bookings`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch bookings");
  }
  return response.json();
}

export async function fetchBookingsByEmail(email: string): Promise<(Booking & { event: Event })[]> {
  const bookings = await fetchBookings();
  const userBookings = bookings.filter((b) => b.userEmail === email);

  // Fetch event details for each booking
  const bookingsWithEvents = await Promise.all(
    userBookings.map(async (booking) => {
      const event = await fetchEvent(booking.eventId);
      return {
        ...booking,
        event,
      };
    }),
  );

  return bookingsWithEvents;
}

export { type Event, type Booking };

