# Design Document

## Ticketing Platform with Dynamic Pricing

### Architecture Overview

This is a full-stack event ticketing platform built with:
- **Frontend**: Next.js 15 with App Router (Server Components)
- **Backend**: NestJS REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Monorepo**: Turborepo

---

## Pricing Algorithm Implementation

### Design Philosophy

The dynamic pricing engine implements three weighted rules that combine to determine the current ticket price:

1. **Time-Based Pricing** (Weight: 0.4)
   - Price increases as the event date approaches
   - Tomorrow: +50% of base price
   - Within 7 days: +20% of base price
   - Within 14 days: +10% of base price
   - Beyond 14 days: no time-based adjustment

2. **Demand-Based Pricing** (Weight: 0.35)
   - Monitors booking velocity (bookings in the last hour)
   - When bookings exceed threshold (default: 10/hour), price increases by 15%
   - Adjustment scales proportionally to excess velocity
   - Formula: `adjustment = (velocity - threshold) / threshold * increasePercent * weight`

3. **Inventory-Based Pricing** (Weight: 0.25)
   - Price increases when inventory falls below threshold (default: 20%)
   - Adjustment scales with scarcity factor
   - Formula: `adjustment = increasePercent * (1 - remainingRatio/threshold) * weight`

### Price Calculation Flow

```
1. Fetch event with current state
2. Apply time-based adjustment (if event date is soon)
3. Calculate booking velocity and apply demand adjustment (if high)
4. Check inventory level and apply scarcity adjustment (if low)
5. Combine all adjustments: basePrice × (1 + Σadjustments)
6. Clamp to floor and ceiling prices
```

All weights are configurable via environment variables, allowing fine-tuning without code changes.

---

## Concurrency Control Solution

### Problem

When multiple users simultaneously try to book the last available ticket(s), the system must prevent overbooking.

### Implementation

The solution uses **database transactions with row-level locking**:

```typescript
await db.transaction(async (tx) => {
  // Lock the row to prevent concurrent reads with stale data
  const event = await tx.select()...where(eq(events.id, eventId))...
  
  // Check availability AFTER acquiring lock
  if (availableTickets < quantity) {
    throw new ConflictException("Not enough tickets");
  }
  
  // Create booking
  await tx.insert(bookings)...values(...)
  
  // Update event bookedTickets atomically
  await tx.update(events).set({bookedTickets: old + quantity})
});
```

### Key Mechanisms

1. **Transactional Isolation**: All operations occur in a single transaction
2. **Row-Level Locking**: PostgreSQL automatically locks the row for the duration of the transaction
3. **Atomic Updates**: The booked_tickets count updates atomically with the booking creation
4. **Conflict Detection**: If availability check fails, a clear error is returned

### Testing Proof

The `concurrency.test.ts` file demonstrates this works by:
1. Creating an event with 1 ticket remaining
2. Attempting 2 simultaneous bookings
3. Asserting exactly 1 succeeds and 1 fails with proper error message
4. Verifying database consistency (no overselling)

---

## Monorepo Architecture Decisions

### Package Structure

```
packages/
  database/          # Shared database schema and client
  ui/                # Shared UI components (pre-configured)
  eslint-config/     # Shared linting
  typescript-config/ # Shared TypeScript configs

apps/
  api/               # NestJS backend API
  web/               # Next.js frontend
```

### Why This Structure?

- **Shared Database Package**: Enforces consistent schema across frontend and backend
- **Clean Boundaries**: API and Web are separate deployable units
- **Code Sharing**: Common business logic lives in packages
- **Development Speed**: Changes propagate automatically via Turborepo

### Trade-offs Made

**Simplicity over Complexity**
- No separate service layer for pricing - logic lives directly in the service
- Straightforward REST endpoints instead of GraphQL
- Direct database queries instead of using a query builder abstraction

**Convenience over Strictness**
- Server actions for form handling instead of tRPC for type safety
- Polling-based price updates instead of WebSocket for real-time updates
- Email validation with simple regex instead of a full validation library

---

## What I Would Improve with More Time

### 1. Caching Layer
Add Redis caching for:
- Price calculations (reduce database load)
- Event listings (faster page loads)
- Booking availability checks

### 2. Rate Limiting
Prevent abuse with:
- Per-IP rate limits on booking endpoints
- Per-email booking limits
- Distributed rate limiting with Redis

### 3. Event Sourcing
Track pricing history:
- Store every price change with timestamp
- Enable price trend analysis
- Debug pricing algorithm behavior

### 4. Advanced Concurrency Tests
More comprehensive testing:
- Stress test with 100+ concurrent bookings
- Database-level performance benchmarks
- Load testing with realistic scenarios

### 5. Analytics Dashboard
Build an admin interface for:
- Real-time revenue tracking
- Booking velocity graphs
- Price adjustment effectiveness metrics

### 6. Payment Integration
While not required, in production:
- Integrate Stripe for payment processing
- Handle refunds and cancellations
- Add ticket transfers

---

## Technical Trade-offs Summary

| Decision | Chosen Approach | Alternative | Why |
|----------|----------------|-------------|-----|
| Framework | NestJS | Express | Built-in modularity, decorators, dependency injection |
| Database | Drizzle ORM | Prisma | Type-safe, lightweight, easy migrations |
| API Style | REST | GraphQL | Simpler, better caching, easier to debug |
| Concurrency | DB Transactions | Redis Queues | Simpler, no external dependencies, ACID guarantees |
| Price Updates | Polling | WebSockets | Simpler, works everywhere, easier to debug |
| Testing | Vitest | Jest | Faster, better ES6 support, built-in coverage |

---

## Database Schema Rationale

### Events Table
- **pricingRules JSON field**: Allows configuration without schema changes
- **bookedTickets counter**: Atomic updates prevent race conditions
- **Indices on date**: Fast queries for upcoming events

### Bookings Table
- **pricePaid snapshot**: Records what was actually paid, independent of current price
- **bookingTimestamp**: Enables velocity calculations
- **Foreign key to events**: Ensures data integrity

This design prioritizes correctness and simplicity over micro-optimizations.

