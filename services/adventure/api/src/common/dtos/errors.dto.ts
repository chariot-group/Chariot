
export class InvalidParamDto {
  name: string;

  reason: string;
}

export class ProblemDetailsDto {
  type: string;

  title: string;

  status: number;

  instance: string;

  detail?: string;

  "invalid-params"?: InvalidParamDto[];
}
