import { Type } from "class-transformer";
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsDateString,
    IsInt,
    IsNumber,
    IsOptional,
    ValidateNested,
} from "class-validator";
import { SaleDetailDto } from "./sale-detail.dto";

export class SaleHeaderDto {
    @IsOptional()
    @IsInt()
    id?: number;

    @IsOptional()
    @IsDateString()
    sale_date?: string;

    @IsOptional()
    @IsNumber()
    total_amount?: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsInt()
    user_id: number;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => SaleDetailDto)
    details: SaleDetailDto[];
}
