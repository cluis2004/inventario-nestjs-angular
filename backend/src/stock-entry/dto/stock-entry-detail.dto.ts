import { IsInt, IsNotEmpty, Max, Min } from "class-validator";

export class StockEntryDetailDto {
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    product_id: number;

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Max(999999)
    quantity: number;
}
