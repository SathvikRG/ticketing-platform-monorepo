import { Injectable } from "@nestjs/common";
import { db, events, bookings } from "@repo/database";
import { eq, and, gte } from "drizzle-orm";
import type { Event } from "@repo/database";

interface PriceAdjustment {
  rule: string;
  adjustment: number;
  adjustedPrice: number;
}

@Injectable()
export class PricingService {
  /**
   * Calculate dynamic price based on three rules:
   * 1. Time-based: Price increases as event date approaches
   * 2. Demand-based: Price increases with booking velocity
   * 3. Inventory-based: Price increases as tickets sell out
   */
  async calculatePrice(eventId: number): Promise<{
    currentPrice: number;
    basePrice: number;
    adjustments: PriceAdjustment[];
  }> {
    // Fetch event with current bookings count
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!event) {
      throw new Error("Event not found");
    }

    const basePrice = Number(event.basePrice);
    const adjustments: PriceAdjustment[] = [];
    let calculatedPrice = basePrice;

    // Get pricing rules from environment or use defaults
    const timeWeight = parseFloat(process.env.PRICING_RULE_TIME_WEIGHT || "0.4");
    const demandWeight = parseFloat(process.env.PRICING_RULE_DEMAND_WEIGHT || "0.35");
    const inventoryWeight = parseFloat(process.env.PRICING_RULE_INVENTORY_WEIGHT || "0.25");

    const rules = event.pricingRules;

    // Rule 1: Time-based adjustment
    if (rules.timeBased.enabled) {
      const timeAdjustment = this.calculateTimeBasedAdjustment(event.date, rules.timeBased.weight);
      if (timeAdjustment > 0) {
        const adjustedPrice = basePrice * (1 + timeAdjustment);
        adjustments.push({
          rule: "time-based",
          adjustment: timeAdjustment,
          adjustedPrice,
        });
        calculatedPrice = adjustedPrice;
      }
    }

    // Rule 2: Demand-based adjustment (velocity in last hour)
    if (rules.demandBased.enabled) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentBookings = await db
        .select()
        .from(bookings)
        .where(and(eq(bookings.eventId, eventId), gte(bookings.bookingTimestamp, oneHourAgo)));

      const velocity = recentBookings.length;
      const demandAdjustment = this.calculateDemandBasedAdjustment(
        velocity,
        rules.demandBased.velocityThreshold,
        rules.demandBased.increasePercent,
        rules.demandBased.weight,
      );

      if (demandAdjustment > 0) {
        calculatedPrice *= 1 + demandAdjustment;
        adjustments.push({
          rule: "demand-based",
          adjustment: demandAdjustment,
          adjustedPrice: calculatedPrice,
        });
      }
    }

    // Rule 3: Inventory-based adjustment
    if (rules.inventoryBased.enabled) {
      const bookedTickets = event.bookedTickets;
      const totalTickets = event.totalTickets;
      const remainingRatio = (totalTickets - bookedTickets) / totalTickets;

      if (remainingRatio <= rules.inventoryBased.lowInventoryThreshold) {
        const inventoryAdjustment = this.calculateInventoryBasedAdjustment(
          remainingRatio,
          rules.inventoryBased.lowInventoryThreshold,
          rules.inventoryBased.increasePercent,
          rules.inventoryBased.weight,
        );
        calculatedPrice *= 1 + inventoryAdjustment;
        adjustments.push({
          rule: "inventory-based",
          adjustment: inventoryAdjustment,
          adjustedPrice: calculatedPrice,
        });
      }
    }

    // Ensure price stays within floor and ceiling
    const floorPrice = Number(event.floorPrice);
    const ceilingPrice = Number(event.ceilingPrice);
    calculatedPrice = Math.max(floorPrice, Math.min(ceilingPrice, calculatedPrice));

    return {
      currentPrice: Math.round(calculatedPrice * 100) / 100,
      basePrice,
      adjustments,
    };
  }

  /**
   * Time-based pricing: Price increases as event date approaches
   * Examples:
   * - 30+ days out: no adjustment
   * - Within 7 days: +20%
   * - Tomorrow: +50%
   */
  private calculateTimeBasedAdjustment(eventDate: Date, weight: number): number {
    const now = new Date();
    const diffMs = eventDate.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays <= 1) {
      return 0.5 * weight;
    } else if (diffDays <= 7) {
      return 0.2 * weight;
    } else if (diffDays <= 14) {
      return 0.1 * weight;
    }
    return 0;
  }

  /**
   * Demand-based pricing: Price increases with booking velocity
   * Example: If more than threshold bookings happened in the last hour, increase by X%
   */
  private calculateDemandBasedAdjustment(
    velocity: number,
    threshold: number,
    increasePercent: number,
    weight: number,
  ): number {
    if (velocity > threshold) {
      const excessVelocity = velocity - threshold;
      // Scale the adjustment based on excess velocity
      const scaledIncrease = Math.min((excessVelocity / threshold) * (increasePercent / 100), increasePercent / 100);
      return scaledIncrease * weight;
    }
    return 0;
  }

  /**
   * Inventory-based pricing: Price increases as tickets sell out
   * Example: When less than threshold% remain, increase by X%
   */
  private calculateInventoryBasedAdjustment(
    remainingRatio: number,
    threshold: number,
    increasePercent: number,
    weight: number,
  ): number {
    if (remainingRatio <= threshold) {
      // Higher price adjustment when closer to selling out
      const scarcityFactor = 1 - remainingRatio / threshold;
      return (increasePercent / 100) * scarcityFactor * weight;
    }
    return 0;
  }
}

