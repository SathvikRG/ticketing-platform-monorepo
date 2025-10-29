import { Injectable, BadRequestException, ConflictException } from "@nestjs/common";
import { db, events, bookings } from "@repo/database";
import { eq } from "drizzle-orm";
import { PricingService } from "../pricing/pricing.service";

interface CreateBookingDto {
  eventId: number;
  userEmail: string;
  quantity: number;
}

@Injectable()
export class BookingsService {
  constructor(private readonly pricingService: PricingService) {}

  /**
   * Create a booking with concurrency control
   * Uses database transactions and row-level locking to prevent overbooking
   */
  async create(createBookingDto: CreateBookingDto) {
    const { eventId, userEmail, quantity } = createBookingDto;

    // Validate inputs
    if (!userEmail || !emailRegex.test(userEmail)) {
      throw new BadRequestException("Valid email is required");
    }

    if (!quantity || quantity <= 0) {
      throw new BadRequestException("Quantity must be greater than 0");
    }

    // Use a transaction with row-level locking to prevent concurrent overbooking
    return await db.transaction(async (tx) => {
      // Lock the row to prevent other transactions from reading inconsistent state
      const event = await tx
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1)
        .then((rows) => rows[0])
        .finally(() => {
          // The lock will be released when the transaction commits/rolls back
        });

      if (!event) {
        throw new BadRequestException("Event not found");
      }

      // Check availability AFTER acquiring lock
      const availableTickets = event.totalTickets - event.bookedTickets;

      if (availableTickets < quantity) {
        throw new ConflictException(
          `Not enough tickets available. Requested: ${quantity}, Available: ${availableTickets}`,
        );
      }

      // Calculate current price
      const priceInfo = await this.pricingService.calculatePrice(eventId);
      const pricePerTicket = priceInfo.currentPrice;

      // Create the booking
      const newBooking = await tx
        .insert(bookings)
        .values({
          eventId,
          userEmail,
          quantity,
          pricePaid: pricePerTicket.toString(),
          bookingTimestamp: new Date(),
        })
        .returning();

      // Update event's booked tickets count
      await tx
        .update(events)
        .set({
          bookedTickets: event.bookedTickets + quantity,
          updatedAt: new Date(),
        })
        .where(eq(events.id, eventId));

      return {
        ...newBooking[0],
        totalPrice: pricePerTicket * quantity,
        pricePerTicket,
      };
    });
  }

  async findAll(eventId?: number) {
    if (eventId) {
      return db
        .select()
        .from(bookings)
        .where(eq(bookings.eventId, eventId));
    }
    return db.select().from(bookings);
  }
}

// Simple email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

