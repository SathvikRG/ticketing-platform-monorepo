import { Controller, Get, Post, Body, Query, ParseIntPipe } from "@nestjs/common";
import { BookingsService } from "./bookings.service";

class CreateBookingDto {
  eventId: number;
  userEmail: string;
  quantity: number;
}

@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  async findAll(@Query("eventId") eventId?: string) {
    const eventIdNum = eventId ? parseInt(eventId, 10) : undefined;
    return this.bookingsService.findAll(eventIdNum);
  }
}

