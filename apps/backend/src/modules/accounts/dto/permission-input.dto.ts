import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class PermissionInputDto {
  @IsString()
  @IsNotEmpty()
  module!: string;

  @IsBoolean()
  canView!: boolean;

  @IsBoolean()
  canEdit!: boolean;

  @IsBoolean()
  canDelete!: boolean;
}
