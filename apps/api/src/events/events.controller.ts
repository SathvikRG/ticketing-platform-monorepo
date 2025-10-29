import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe } from "@nestjs/common";
import { EventsService } from "./events.service";
import { ApiKeyGuard } from "./guards/api-key.guard";

class CreateEventDto {
  name: string;
  date: string;
  venue: string;
  description?: string;
  totalTickets: number;
  basePrice: string;
  floorPrice: string;
  ceilingPrice: string;
}

@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async findAll() {
    return this.eventsService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  async create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create({
      ...createEventDto,
      date: new Date(createEventDto.date),
    });
  }

  @Post("seed")
  async seed() {
    return this.eventsService.seed();
  }
}

