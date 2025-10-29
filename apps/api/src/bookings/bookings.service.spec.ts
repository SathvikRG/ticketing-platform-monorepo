import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BookingsService } from "./bookings.service";
import { PricingService } from "../pricing/pricing.service";
import { db, events, bookings } from "@repo/database";

describe("BookingsService", () => {
  let bookingsService: BookingsService;
  let mockPricingService: any;

  beforeEach(() => {
    mockPricingService = {
      calculatePrice: vi.fn().mockResolvedValue({
        currentPrice: 100,
        basePrice: 75,
        adjustments: [],
      }),
    };

    bookingsService = new BookingsService(mockPricingService);
  });

  describe("create", () => {
    it("should validate email format", async () => {
      const invalidEmails = ["invalid", "@example.com", "test@", "test@.com"];

      for (const email of invalidEmails) {
        await expect(
          bookingsService.create({
            eventId: 1,
            userEmail: email,
            quantity: 1,
          }),
        ).rejects.toThrow("Valid email is required");
      }
    });

    it("should validate quantity", async () => {
      // Mock event exists
      vi.spyOn(db, "transaction").mockImplementation(async (callback: any) => {
        return callback({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => Promise.resolve([{ id: 1, totalTickets: 100, bookedTickets: 50 }]),
              }),
            }),
          }),
        });
      });

      await expect(
        bookingsService.create({
          eventId: 1,
          userEmail: "test@example.com",
          quantity: 0,
        }),
      ).rejects.toThrow("Quantity must be greater than 0");
    });

    it("should throw error when event not found", async () => {
      vi.spyOn(db, "transaction").mockImplementation(async (callback: any) => {
        return callback({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => Promise.resolve([]), // No event found
              }),
            }),
          }),
        });
      });

      await expect(
        bookingsService.create({
          eventId: 999,
          userEmail: "test@example.com",
          quantity: 1,
        }),
      ).rejects.toThrow("Event not found");
    });

    it("should throw error when not enough tickets", async () => {
      vi.spyOn(db, "transaction").mockImplementation(async (callback: any) => {
        return callback({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () =>
                  Promise.resolve([
                    {
                      id: 1,
                      totalTickets: 100,
                      bookedTickets: 95, // Only 5 tickets left
                    },
                  ]),
              }),
            }),
          }),
        });
      });

      await expect(
        bookingsService.create({
          eventId: 1,
          userEmail: "test@example.com",
          quantity: 10, // Trying to book 10 when only 5 available
        }),
      ).rejects.toThrow("Not enough tickets available");
    });
  });
});

