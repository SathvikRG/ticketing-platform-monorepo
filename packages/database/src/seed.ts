import { db, events, bookings } from "./index";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Starting database seed...");

  // Clear existing data
  console.log("Clearing existing data...");
  await db.delete(bookings);
  await db.delete(events);

  // Define sample events
  const today = new Date();
  
  const sampleEvents = [
    {
      name: "Summer Music Festival",
      date: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      venue: "Central Park, New York",
      description: "A 3-day outdoor music festival featuring top artists from around the world.",
      totalTickets: 5000,
      bookedTickets: 1200,
      basePrice: "75.00",
      currentPrice: "75.00",
      floorPrice: "50.00",
      ceilingPrice: "150.00",
      pricingRules: {
        timeBased: { enabled: true, weight: 0.4 },
        demandBased: { enabled: true, weight: 0.35, velocityThreshold: 10, increasePercent: 15 },
        inventoryBased: { enabled: true, weight: 0.25, lowInventoryThreshold: 0.2, increasePercent: 25 },
      },
    },
    {
      name: "Tech Conference 2024",
      date: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      venue: "Convention Center, San Francisco",
      description: "Annual technology conference with talks from industry leaders.",
      totalTickets: 2000,
      bookedTickets: 1450,
      basePrice: "200.00",
      currentPrice: "210.00",
      floorPrice: "150.00",
      ceilingPrice: "300.00",
      pricingRules: {
        timeBased: { enabled: true, weight: 0.4 },
        demandBased: { enabled: true, weight: 0.35, velocityThreshold: 10, increasePercent: 15 },
        inventoryBased: { enabled: true, weight: 0.25, lowInventoryThreshold: 0.2, increasePercent: 25 },
      },
    },
    {
      name: "Rock Concert Tonight",
      date: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      venue: "Madison Square Garden, New York",
      description: "Epic rock concert with multiple bands.",
      totalTickets: 15000,
      bookedTickets: 14700,
      basePrice: "100.00",
      currentPrice: "135.00",
      floorPrice: "80.00",
      ceilingPrice: "200.00",
      pricingRules: {
        timeBased: { enabled: true, weight: 0.4 },
        demandBased: { enabled: true, weight: 0.35, velocityThreshold: 10, increasePercent: 15 },
        inventoryBased: { enabled: true, weight: 0.25, lowInventoryThreshold: 0.2, increasePercent: 25 },
      },
    },
    {
      name: "Comedy Show",
      date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      venue: "Comedy Club, Los Angeles",
      description: "Stand-up comedy night featuring renowned comedians.",
      totalTickets: 300,
      bookedTickets: 150,
      basePrice: "40.00",
      currentPrice: "46.00",
      floorPrice: "30.00",
      ceilingPrice: "80.00",
      pricingRules: {
        timeBased: { enabled: true, weight: 0.4 },
        demandBased: { enabled: true, weight: 0.35, velocityThreshold: 10, increasePercent: 15 },
        inventoryBased: { enabled: true, weight: 0.25, lowInventoryThreshold: 0.2, increasePercent: 25 },
      },
    },
    {
      name: "Art Exhibition Opening",
      date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      venue: "Modern Art Museum, Chicago",
      description: "Exclusive opening night for contemporary art exhibition.",
      totalTickets: 500,
      bookedTickets: 80,
      basePrice: "60.00",
      currentPrice: "60.00",
      floorPrice: "40.00",
      ceilingPrice: "120.00",
      pricingRules: {
        timeBased: { enabled: true, weight: 0.4 },
        demandBased: { enabled: true, weight: 0.35, velocityThreshold: 10, increasePercent: 15 },
        inventoryBased: { enabled: true, weight: 0.25, lowInventoryThreshold: 0.2, increasePercent: 25 },
      },
    },
    {
      name: "Food & Wine Festival",
      date: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      venue: "Expo Center, Miami",
      description: "Gourmet food and wine tasting event with celebrity chefs.",
      totalTickets: 1000,
      bookedTickets: 750,
      basePrice: "90.00",
      currentPrice: "98.00",
      floorPrice: "70.00",
      ceilingPrice: "150.00",
      pricingRules: {
        timeBased: { enabled: true, weight: 0.4 },
        demandBased: { enabled: true, weight: 0.35, velocityThreshold: 10, increasePercent: 15 },
        inventoryBased: { enabled: true, weight: 0.25, lowInventoryThreshold: 0.2, increasePercent: 25 },
      },
    },
  ];

  // Insert events
  console.log("Inserting events...");
  const insertedEvents = await db.insert(events).values(sampleEvents).returning();
  console.log(`Inserted ${insertedEvents.length} events`);

  // Create some sample bookings for variety
  const sampleBookings = [
    {
      eventId: insertedEvents[0].id,
      userEmail: "john.doe@example.com",
      quantity: 2,
      pricePaid: "75.00",
      bookingTimestamp: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      eventId: insertedEvents[0].id,
      userEmail: "jane.smith@example.com",
      quantity: 1,
      pricePaid: "75.00",
      bookingTimestamp: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      eventId: insertedEvents[1].id,
      userEmail: "alice.johnson@example.com",
      quantity: 3,
      pricePaid: "200.00",
      bookingTimestamp: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      eventId: insertedEvents[2].id,
      userEmail: "bob.brown@example.com",
      quantity: 4,
      pricePaid: "120.00",
      bookingTimestamp: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  console.log("Inserting sample bookings...");
  await db.insert(bookings).values(sampleBookings);
  console.log(`Inserted ${sampleBookings.length} bookings`);

  console.log("Database seed completed successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});

