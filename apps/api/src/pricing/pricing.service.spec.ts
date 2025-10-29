import { describe, it, expect, beforeEach, vi } from "vitest";
import { PricingService } from "./pricing.service";
import { db, events, bookings } from "@repo/database";

describe("PricingService", () => {
  let pricingService: PricingService;

  beforeEach(() => {
    pricingService = new PricingService();
  });

  describe("Time-based pricing", () => {
    it("should apply 50% increase for events happening tomorrow", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const adjustment = (pricingService as any).calculateTimeBasedAdjustment(tomorrow, 0.4);
      expect(adjustment).toBeCloseTo(0.2, 2); // 50% * 0.4 weight = 0.2
    });

    it("should apply 20% increase for events within 7 days", () => {
      const inFiveDays = new Date();
      inFiveDays.setDate(inFiveDays.getDate() + 5);

      const adjustment = (pricingService as any).calculateTimeBasedAdjustment(inFiveDays, 0.4);
      expect(adjustment).toBeCloseTo(0.08, 2); // 20% * 0.4 weight = 0.08
    });

    it("should not apply time-based increase for events more than 30 days away", () => {
      const inFortyDays = new Date();
      inFortyDays.setDate(inFortyDays.getDate() + 40);

      const adjustment = (pricingService as any).calculateTimeBasedAdjustment(inFortyDays, 0.4);
      expect(adjustment).toBe(0);
    });
  });

  describe("Demand-based pricing", () => {
    it("should apply increase when velocity exceeds threshold", () => {
      const adjustment = (pricingService as any).calculateDemandBasedAdjustment(
        20, // velocity
        10, // threshold
        15, // increase percent
        0.35, // weight
      );

      expect(adjustment).toBeGreaterThan(0);
    });

    it("should not apply increase when velocity is below threshold", () => {
      const adjustment = (pricingService as any).calculateDemandBasedAdjustment(
        5, // velocity
        10, // threshold
        15, // increase percent
        0.35, // weight
      );

      expect(adjustment).toBe(0);
    });
  });

  describe("Inventory-based pricing", () => {
    it("should apply increase when inventory is low", () => {
      const adjustment = (pricingService as any).calculateInventoryBasedAdjustment(
        0.15, // 15% remaining
        0.2, // 20% threshold
        25, // 25% increase
        0.25, // weight
      );

      expect(adjustment).toBeGreaterThan(0);
    });

    it("should not apply increase when inventory is above threshold", () => {
      const adjustment = (pricingService as any).calculateInventoryBasedAdjustment(
        0.5, // 50% remaining
        0.2, // 20% threshold
        25, // 25% increase
        0.25, // weight
      );

      expect(adjustment).toBe(0);
    });

    it("should scale adjustment based on scarcity", () => {
      const lowAdjustment = (pricingService as any).calculateInventoryBasedAdjustment(
        0.15, // 15% remaining
        0.2, // 20% threshold
        25, // 25% increase
        0.25, // weight
      );

      const veryLowAdjustment = (pricingService as any).calculateInventoryBasedAdjustment(
        0.05, // 5% remaining
        0.2, // 20% threshold
        25, // 25% increase
        0.25, // weight
      );

      expect(veryLowAdjustment).toBeGreaterThan(lowAdjustment);
    });
  });

  describe("Price calculation with floor and ceiling", () => {
    it("should respect floor price", async () => {
      // Create a mock event with very low calculated price
      const mockEvent = {
        id: 1,
        name: "Test Event",
        date: new Date("2025-12-31"),
        venue: "Test Venue",
        description: "Test",
        totalTickets: 100,
        bookedTickets: 50,
        basePrice: "10.00",
        currentPrice: "10.00",
        floorPrice: "15.00", // Floor higher than base
        ceilingPrice: "100.00",
        pricingRules: {
          timeBased: { enabled: false, weight: 0.4 },
          demandBased: { enabled: false, weight: 0.35, velocityThreshold: 10, increasePercent: 15 },
          inventoryBased: { enabled: false, weight: 0.25, lowInventoryThreshold: 0.2, increasePercent: 25 },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the database call
      vi.spyOn(db, "select").mockImplementation(() => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockEvent]),
          }),
        }),
      }));

      const result = await pricingService.calculatePrice(1);

      // Price should be at least the floor price
      expect(result.currentPrice).toBeGreaterThanOrEqual(15);
    });
  });
});

