import { Injectable, BadRequestException } from "@nestjs/common";
import { db, events, bookings } from "@repo/database";
import { eq } from "drizzle-orm";

@Injectable()
export class AnalyticsService {
  async getEventAnalytics(eventId: number) {
    const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1).then((rows) => rows[0]);

    if (!event) {
      throw new BadRequestException("Event not found");
    }

    const eventBookings = await db.select().from(bookings).where(eq(bookings.eventId, eventId));

    // Calculate metrics
    const totalSold = event.bookedTickets;
    const totalRevenue = eventBookings.reduce((sum, booking) => {
      return sum + Number(booking.pricePaid) * booking.quantity;
    }, 0);

    const averagePrice = eventBookings.length > 0 ? totalRevenue / totalSold : 0;
    const remaining = event.totalTickets - event.bookedTickets;
    const soldPercentage = (totalSold / event.totalTickets) * 100;

    return {
      eventId,
      eventName: event.name,
      totalTickets: event.totalTickets,
      totalSold,
      remaining,
      soldPercentage: Math.round(soldPercentage * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averagePrice: Math.round(averagePrice * 100) / 100,
      currentPrice: Number(event.currentPrice),
      basePrice: Number(event.basePrice),
    };
  }

  async getSummaryAnalytics() {
    const allEvents = await db.select().from(events);
    const allBookings = await db.select().from(bookings);

    const totalEvents = allEvents.length;
    const totalBookings = allBookings.length;
    const totalTicketsSold = allBookings.reduce((sum, booking) => sum + booking.quantity, 0);

    const totalRevenue = allBookings.reduce((sum, booking) => {
      return sum + Number(booking.pricePaid) * booking.quantity;
    }, 0);

    const averageBookingPrice = allBookings.length > 0 ? totalRevenue / totalBookings : 0;

    // Group bookings by event
    const eventStats = allEvents.map((event) => {
      const eventBookings = allBookings.filter((b) => b.eventId === event.id);
      const eventRevenue = eventBookings.reduce((sum, booking) => {
        return sum + Number(booking.pricePaid) * booking.quantity;
      }, 0);
      const ticketsSold = event.bookedTickets;

      return {
        eventId: event.id,
        eventName: event.name,
        ticketsSold,
        revenue: Math.round(eventRevenue * 100) / 100,
        avgPrice: ticketsSold > 0 ? Math.round((eventRevenue / ticketsSold) * 100) / 100 : 0,
      };
    });

    return {
      totalEvents,
      totalBookings,
      totalTicketsSold,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageBookingPrice: Math.round(averageBookingPrice * 100) / 100,
      events: eventStats,
    };
  }
}

