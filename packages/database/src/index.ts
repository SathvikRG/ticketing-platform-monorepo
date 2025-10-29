import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const connectionString = process.env.DATABASE_URL;

// Create the connection
const queryClient = postgres(connectionString);

// Create the database instance
export const db = drizzle(queryClient, { schema });

// Export schema for use in other packages
export * from "./schema";
export { queryClient as client };

