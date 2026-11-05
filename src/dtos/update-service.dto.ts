import {
  IsBoolean,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateServiceDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Length(2, 120)
  title?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Length(2, 2000)
  description?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Length(2, 80)
  category?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Matches(/^(0|[1-9]\d{0,8})(\.\d{1,2})?$/)
  startingPrice?: string;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  imageUrl?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  published?: boolean;
}
