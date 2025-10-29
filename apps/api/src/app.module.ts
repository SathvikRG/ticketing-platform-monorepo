import { Module } from "@nestjs/common";
import { EventsModule } from "./events/events.module";
import { BookingsModule } from "./bookings/bookings.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { DatabaseModule } from "./database/database.module";
import { PricingModule } from "./pricing/pricing.module";

@Module({
  imports: [DatabaseModule, PricingModule, EventsModule, BookingsModule, AnalyticsModule],
})
export class AppModule {}

