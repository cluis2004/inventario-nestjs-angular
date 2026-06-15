import { Body, Controller, Param, ParseIntPipe, Post } from "@nestjs/common";
import { StockEntryDto } from "./dto/stock-entry.dto";
import { StockEntryService } from "./stock-entry.service";

@Controller('stockentrycontroller')
export class StockEntryController {
    constructor(
        private readonly service: StockEntryService,
    ) {}

    @Post('getall')
    getAll() {
        return this.service.getAll();
    }

    @Post('getbyid/:id')
    getById(@Param('id', ParseIntPipe) id: number) {
        return this.service.getById(id);
    }

    @Post('save')
    save(@Body() data: StockEntryDto) {
        return this.service.save(data);
    }

    @Post('delete/:id')
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.service.delete(id);
    }
}
