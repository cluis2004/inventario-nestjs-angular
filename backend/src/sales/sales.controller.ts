import { Body, Controller, Param, ParseIntPipe, Post } from "@nestjs/common";
import { SaleHeaderDto } from "./dto/sale-header.dto";
import { SalesService } from "./sales.service";

@Controller('salescontroller')
export class SalesController {
    constructor(
        private readonly service: SalesService,
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
    save(@Body() data: SaleHeaderDto) {
        return this.service.save(data);
    }

    @Post('delete/:id')
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.service.delete(id);
    }
}
