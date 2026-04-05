import { IsString, IsNumber, IsEnum, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum SplitType {
  EQUAL = 'EQUAL',
  UNEQUAL = 'UNEQUAL',
}

class ParticipantDto {
  @IsString()
  public user: string;

  @IsNumber()
  @IsOptional()
  public amountOwed?: number;
}

export class CreateExpenseDto {
  @IsString()
  public description: string;

  @IsNumber()
  public totalAmount: number;

  @IsString()
  public payer: string;

  @IsEnum(SplitType)
  public splitType: SplitType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  public participants: ParticipantDto[];
}
