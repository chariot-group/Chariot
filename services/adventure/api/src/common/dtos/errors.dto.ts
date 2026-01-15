import { ApiProperty } from "@nestjs/swagger";

export class InvalidParamDto {
  @ApiProperty({ example: "label" })
  name: string;

  @ApiProperty({ example: "Must be at least 3 characters long" })
  reason: string;
}

export class ProblemDetailsDto {
  @ApiProperty({ example: "https://httpstatuses.io/400" })
  type: string;

  @ApiProperty({ example: "Bad request" })
  title: string;

  @ApiProperty({ example: 400 })
  status: number;

  @ApiProperty({ example: "/campaigns" })
  instance: string;

  @ApiProperty({ example: "The 'name' field is required.", required: false })
  detail?: string;

  "invalid-params"?: InvalidParamDto[];
}
