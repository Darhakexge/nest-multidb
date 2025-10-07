import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { EventDto } from './dto/event.dto';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    async getHello() {
        return await this.appService.findUserRaw('app1', 1);
    }

    @Post()
    handleEvent(@Body() dto: EventDto) {
        return {
            message: 'Validated successfully!',
            payload: dto,
        };
    }
}
