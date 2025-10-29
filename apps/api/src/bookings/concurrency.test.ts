import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db, events, bookings } from "@repo/database";
import { BookingsService } from "./bookings.service";
import { PricingService } from "../pricing/pricing.service";

/**
 * This test proves that the booking system prevents overbooking
 * when multiple users attempt to book the last available ticket simultaneously.
 *
 * Test structure:
 * 1. Create an event with only 1 ticket remaining
 * 2. Make 2 simultaneous booking requests
 * 3. Assert: Exactly 1 succeeds, 1 fails with proper error
 */
describe("Concurrent Bookings - Overbooking Prevention", () => {
  let bookingsService: BookingsService;
  let pricingService: PricingService;
  let testEventId: number;

  beforeEach(async () => {
    pricingService = new PricingService();
    bookingsService = new BookingsService(pricingService);

    // Create a test event with 1 ticket remaining
    const [newEvent] = await db
      .insert(events)
      .values({
        name: "Test Concurrent Event",
        date: new Date("2025-12-31"),
        venue: "Test Venue",
        description: "Test event for concurrency",
        totalTickets: 100,
        bookedTickets: 99, // Only 1 ticket left
        basePrice: "100.00",
        currentPrice: "100.00",
        floorPrice: "50.00",
        ceilingPrice: "200.00",
        pricingRules: {
          timeBased: { enabled: true, weight: 0.4 },
          demandBased: { enabled: true, weight: 0.35, velocityThreshold: 10, increasePercent: 15 },
          inventoryBased: { enabled: true, weight: 0.25, lowInventoryThreshold: 0.2, increasePercent: 25 },
        },
      })
      .returning();

    testEventId = newEvent.id;

    // Clear any existing bookings for this event
    await db.delete(bookings).where(eq(bookings.eventId, testEventId));
  });

  afterEach(async () => {
    // Clean up test data
    if (testEventId) {
      await db.delete(bookings).where(eq(bookings.eventId, testEventId));
      await db.delete(events).where(eq(events.id, testEventId));
    }
  });

  it("prevents overbooking of last ticket", async () => {
    // Execute: Make 2 simultaneous booking requests
    const promises = [
      bookingsService.create({
        eventId: testEventId,
        userEmail: "user1@example.com",
        quantity: 1,
      }),
      bookingsService.create({
        eventId: testEventId,
        userEmail: "user2@example.com",
        quantity: 1,
      }),
    ];

    const results = await Promise.allSettled(promises);

    // Assert: Exactly 1 succeeds, 1 fails with proper error
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failureCount = results.filter((r) => r.status === "rejected").length;

    expect(successCount).toBe(1);
    expect(failureCount).toBe(1);

    // Verify the failure message
    const failure = results.find((r) => r.status === "rejected");
    expect(failure).toBeDefined();
    if (failure.status === "rejected") {
      expect(failure.reason.message).toContain("Not enough tickets available");
    }

    // Verify the database state
    const finalBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.eventId, testEventId));

    expect(finalBookings.length).toBe(1); // Only one booking succeeded

    // Verify the event's bookedTickets count
    const [updatedEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, testEventId))
      .limit(1);

    expect(updatedEvent.bookedTickets).toBe(100); // Total tickets fully booked
  });

  it("prevents multiple concurrent bookings exceeding availability", async () => {
    // Create event with 5 tickets remaining
    const [eventWithFive] = await db
      .insert(events)
      .values({
        name: "Test Event - 5 Tickets",
        date: new Date("2025-12-31"),
        venue: "Test Venue",
        description: "Test",
        totalTickets: 100,
        bookedTickets: 95, // 5 tickets left
        basePrice: "100.00",
        currentPrice: "100.00",
        floorPrice: "50.00",
        ceilingPrice: "200.00",
        pricingRules: {
          timeBased: { enabled: true, weight: 0.4 },
          demandBased: { enabled: true, weight: 0.35, velocityThreshold: 10, increasePercent: 15 },
          inventoryBased: { enabled: true, weight: 0.25, lowInventoryThreshold: 0.2, increasePercent: 25 },
        },
      })
      .returning();

    // Try to book 3, 2, and 1 tickets simultaneously (total 6, but only 5 available)
    const promises = [
      bookingsService.create({
        eventId: eventWithFive.id,
        userEmail: "user1@example.com",
        quantity: 3,
      }),
      bookingsService.create({
        eventId: eventWithFive.id,
        userEmail: "user2@example.com",
        quantity: 2,
      }),
      bookingsService.create({
        eventId: eventWithFive.id,
        userEmail: "user3@example.com",
        quantity: 1,
      }),
    ];

    const results = await Promise.allSettled(promises);

    // At most 5 tickets should be booked total
    const finalBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.eventId, eventWithFive.id));

    const totalBooked = finalBookings.reduce((sum, b) => sum + b.quantity, 0);
    expect(totalBooked).toBeLessThanOrEqual(5);

    // Clean up
    await db.delete(bookings).where(eq(bookings.eventId, eventWithFive.id));
    await db.delete(events).where(eq(events.id, eventWithFive.id));
  });
});

// We need to import this since it's used in the test
import { eq } from "drizzle-orm";

