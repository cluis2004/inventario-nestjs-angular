import { IsInt, IsNotEmpty, IsNumber, IsOptional, Max, Min } from "class-validator";

export class SaleDetailDto {
    @IsOptional()
    @IsInt()
    id?: number;

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    product_id: number;

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Max(999999)
    quantity: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    unit_price: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    line_total?: number;
}
