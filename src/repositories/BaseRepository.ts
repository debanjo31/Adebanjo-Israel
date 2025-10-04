export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export abstract class BaseRepository<T> {
  protected abstract getEntityName(): string;

  protected createPaginatedResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): PaginatedResult<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  protected validatePaginationOptions(
    options: PaginationOptions
  ): PaginationOptions {
    const { page, limit } = options;

    return {
      page: Math.max(1, page),
      limit: Math.min(Math.max(1, limit), 100), // Max 100 items per page
    };
  }
}
