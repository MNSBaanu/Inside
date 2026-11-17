import { IsString, Matches, MaxLength } from 'class-validator';

export class ProductSlugParamDto {
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/i)
  slug!: string;
}
