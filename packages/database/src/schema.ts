import { pgTable, varchar, timestamp, jsonb, integer, decimal, serial, index } from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  date: timestamp("date").notNull(),
  venue: varchar("venue", { length: 255 }).notNull(),
  description: varchar("description", { length: 2000 }),
  
  // Capacity fields
  totalTickets: integer("total_tickets").notNull().default(100),
  bookedTickets: integer("booked_tickets").notNull().default(0),
  
  // Pricing fields
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  floorPrice: decimal("floor_price", { precision: 10, scale: 2 }).notNull(),
  ceilingPrice: decimal("ceiling_price", { precision: 10, scale: 2 }).notNull(),
  
  // Pricing rules configuration stored as JSON
  pricingRules: jsonb("pricing_rules").$type<{
    timeBased: { enabled: boolean; weight: number };
    demandBased: { enabled: boolean; weight: number; velocityThreshold: number; increasePercent: number };
    inventoryBased: { enabled: boolean; weight: number; lowInventoryThreshold: number; increasePercent: number };
  }>().notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("events_date_idx").on(table.date),
}));

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  pricePaid: decimal("price_paid", { precision: 10, scale: 2 }).notNull(),
  bookingTimestamp: timestamp("booking_timestamp").defaultNow().notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: index("bookings_event_id_idx").on(table.eventId),
  userEmailIdx: index("bookings_user_email_idx").on(table.userEmail),
}));

// Type exports for TypeScript
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

