import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class ProductDto {
    @IsOptional()
    id?: number;

    @IsNotEmpty()
    @IsString()
    @MaxLength(80)
    name: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0.01)
    @Max(99999999.99)
    price: number;

    @IsNotEmpty()
    @IsInt()
    @Min(0)
    @Max(999999)
    stock: number;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    sku?: string;

    @IsBoolean()
    @IsOptional()
    activo?: boolean;
}
