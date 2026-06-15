import { Type } from "class-transformer";
import {
    ArrayMinSize,
    IsArray,
    IsDateString,
    IsIn,
    IsInt,
    IsOptional,
    ValidateNested,
} from "class-validator";
import { StockEntryDetailDto } from "./stock-entry-detail.dto";

export class StockEntryDto {
    @IsOptional()
    @IsInt()
    id?: number;

    @IsInt()
    user_id: number;

    @IsOptional()
    @IsDateString()
    entry_date?: string;

    @IsOptional()
    @IsIn(['registered', 'cancelled'])
    status?: 'registered' | 'cancelled';

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => StockEntryDetailDto)
    details: StockEntryDetailDto[];
}
