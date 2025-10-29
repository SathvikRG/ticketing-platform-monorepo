# Event Ticketing Platform with Dynamic Pricing

A full-stack event ticketing platform where ticket prices automatically adjust based on time until event, booking velocity, and remaining inventory.

## Stack

- **Frontend**: Next.js 15 with App Router
- **Backend**: NestJS REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Monorepo**: Turborepo
- **Language**: TypeScript (strict mode)

## Features

- **Dynamic Pricing Engine**: Three weighted rules (time-based, demand-based, inventory-based) combine to calculate real-time ticket prices
- **Concurrency Control**: Database transactions prevent overbooking when multiple users book simultaneously
- **Real-time Updates**: Frontend polls for price updates every 30 seconds
- **Analytics**: Event-specific and system-wide metrics

## Prerequisites

- **Node.js**: Version 22 or higher
- **PostgreSQL**: Version 12 or higher
- **pnpm**: Version 9 or higher

Install pnpm globally if you haven't:
```bash
npm install -g pnpm@9
```

## Installation

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Run the setup script to create `.env` files:

```bash
chmod +x scripts/setup-env.sh
./scripts/setup-env.sh
```

Then edit the `.env` files and update `DATABASE_URL` with your PostgreSQL credentials:

**Root `.env`:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ticketing_platform
PORT=3001
API_KEY=dev-api-key-2024
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
PRICING_RULE_TIME_WEIGHT=0.4
PRICING_RULE_DEMAND_WEIGHT=0.35
PRICING_RULE_INVENTORY_WEIGHT=0.25
```

**`apps/api/.env`** and **`packages/database/.env`** should have the same `DATABASE_URL`.

### 3. Create Database

Create a PostgreSQL database:
```bash
createdb ticketing_platform
```

Or using Docker:
```bash
docker run --name ticketing-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=ticketing_platform \
  -p 5432:5432 \
  -d postgres
```

### 4. Initialize Database Schema and Seed Data

```bash
cd packages/database
pnpm db:push
pnpm db:seed
cd ../..
```

## Running the Application

### Development Mode (All Apps)

From the root directory:
```bash
pnpm dev
```

This starts:
- Frontend at `http://localhost:3000`
- Backend API at `http://localhost:3001`

### Individual Commands

**Start Frontend:**
```bash
cd apps/web
pnpm dev
```

**Start Backend:**
```bash
cd apps/api
pnpm dev
```

## Running Tests

### All Tests
```bash
cd apps/api
pnpm test
```

### With Coverage
```bash
cd apps/api
pnpm test:cov
```

### Watch Mode
```bash
cd apps/api
pnpm test:watch
```

### Run Concurrency Test
```bash
cd apps/api
pnpm test concurrency.test.ts
```

## Project Structure

```
ticketing-platform-monorepo/
├── apps/
│   ├── api/                 # NestJS backend
│   │   ├── src/
│   │   │   ├── events/      # Events controller/service
│   │   │   ├── bookings/    # Bookings with concurrency control
│   │   │   ├── analytics/   # Analytics endpoints
│   │   │   ├── pricing/     # Dynamic pricing engine
│   │   │   └── main.ts      # Application entry point
│   │   └── package.json
│   └── web/                 # Next.js frontend
│       ├── app/
│       │   ├── page.tsx           # Events list (home)
│       │   ├── events/            # Event list and detail pages
│       │   ├── bookings/success/  # Booking confirmation
│       │   └── my-bookings/       # User bookings
│       └── lib/
│           └── api.ts             # API client functions
├── packages/
│   ├── database/            # Shared database package
│   │   ├── src/
│   │   │   ├── schema.ts    # Drizzle schema
│   │   │   ├── index.ts     # Database client
│   │   │   └── seed.ts      # Seed script
│   │   └── package.json
│   ├── eslint-config/        # Shared ESLint config
│   └── typescript-config/    # Shared TypeScript config
├── scripts/
│   └── setup-env.sh          # Environment setup script
├── DESIGN.md                 # Architecture and design decisions
└── package.json              # Root package.json
```

## API Endpoints

### Events
- `GET /events` - List all events with current price and availability
- `GET /events/:id` - Get event details with price breakdown
- `POST /events` - Create new event (requires `X-API-Key` header)
- `POST /events/seed` - Seed database with sample events

### Bookings
- `POST /bookings` - Book tickets (body: `eventId`, `userEmail`, `quantity`)
- `GET /bookings?eventId=:id` - List bookings for an event

### Analytics
- `GET /analytics/events/:id` - Event-specific metrics
- `GET /analytics/summary` - System-wide metrics

### Example API Usage

**List all events:**
```bash
curl http://localhost:3001/events
```

**Create a booking:**
```bash
curl -X POST http://localhost:3001/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": 1,
    "userEmail": "user@example.com",
    "quantity": 2
  }'
```

**Get event analytics:**
```bash
curl http://localhost:3001/analytics/events/1
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | API server port | 3001 |
| `API_KEY` | API key for protected endpoints | dev-api-key-2024 |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | http://localhost:3001 |
| `PRICING_RULE_TIME_WEIGHT` | Weight for time-based pricing | 0.4 |
| `PRICING_RULE_DEMAND_WEIGHT` | Weight for demand-based pricing | 0.35 |
| `PRICING_RULE_INVENTORY_WEIGHT` | Weight for inventory-based pricing | 0.25 |

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `pg_isready` or `docker ps`
- Verify `DATABASE_URL` is correct in all `.env` files
- Check if database exists: `psql -l`

### Port Already in Use
- Kill the process using the port:
  - `lsof -ti:3001 | xargs kill` (for API)
  - `lsof -ti:3000 | xargs kill` (for Frontend)

### Test Failures
- Ensure database is set up and seeded
- Check that environment variables are set correctly

## Additional Notes

- The pricing engine recalculates prices in real-time based on time, demand, and inventory
- Prices update every 30 seconds on the frontend (polling)
- Concurrency is handled via database transactions with row-level locking
- See `DESIGN.md` for detailed architecture decisions
