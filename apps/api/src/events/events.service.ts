import { Injectable, BadRequestException } from "@nestjs/common";
import { db, events } from "@repo/database";
import { eq } from "drizzle-orm";
import { PricingService } from "../pricing/pricing.service";

@Injectable()
export class EventsService {
  constructor(private readonly pricingService: PricingService) {}

  async findAll() {
    const allEvents = await db.select().from(events);

    // Calculate current price for each event
    const eventsWithPrices = await Promise.all(
      allEvents.map(async (event) => {
        const priceInfo = await this.pricingService.calculatePrice(event.id);
        return {
          ...event,
          currentPrice: priceInfo.currentPrice,
          availableTickets: event.totalTickets - event.bookedTickets,
        };
      }),
    );

    return eventsWithPrices;
  }

  async findOne(id: number) {
    const event = await db.select().from(events).where(eq(events.id, id)).limit(1).then((rows) => rows[0]);

    if (!event) {
      throw new BadRequestException("Event not found");
    }

    const priceInfo = await this.pricingService.calculatePrice(id);

    return {
      ...event,
      currentPrice: priceInfo.currentPrice,
      basePrice: priceInfo.basePrice,
      priceAdjustments: priceInfo.adjustments,
      availableTickets: event.totalTickets - event.bookedTickets,
    };
  }

  async create(data: {
    name: string;
    date: Date;
    venue: string;
    description?: string;
    totalTickets: number;
    basePrice: string;
    floorPrice: string;
    ceilingPrice: string;
  }) {
    const newEvent = await db
      .insert(events)
      .values({
        name: data.name,
        date: data.date,
        venue: data.venue,
        description: data.description || "",
        totalTickets: data.totalTickets,
        bookedTickets: 0,
        basePrice: data.basePrice,
        currentPrice: data.basePrice,
        floorPrice: data.floorPrice,
        ceilingPrice: data.ceilingPrice,
        pricingRules: {
          timeBased: { enabled: true, weight: 0.4 },
          demandBased: { enabled: true, weight: 0.35, velocityThreshold: 10, increasePercent: 15 },
          inventoryBased: { enabled: true, weight: 0.25, lowInventoryThreshold: 0.2, increasePercent: 25 },
        },
      })
      .returning();

    return newEvent[0];
  }

  async seed() {
    // This endpoint triggers the seed script
    const { exec } = require("child_process");
    return new Promise((resolve, reject) => {
      exec("cd packages/database && pnpm db:seed", (error: Error, stdout: string, stderr: string) => {
        if (error) {
          console.error("Error seeding database:", error);
          reject({ error: "Failed to seed database", details: stderr });
          return;
        }
        resolve({ message: "Database seeded successfully", output: stdout });
      });
    });
  }
}

