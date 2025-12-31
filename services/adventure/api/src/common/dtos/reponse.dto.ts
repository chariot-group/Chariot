export class IResponse<T> {
  message: string;

  data: T;
}
export class PaginationMeta {
  page: number;

  offset: number;

  totalItems: number;
}

export class IPaginatedResponse<T> extends IResponse<T> {
  pagination: PaginationMeta;
}
