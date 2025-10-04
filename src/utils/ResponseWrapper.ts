export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: PaginationMeta;
  timestamp: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class ResponseWrapper {
  static success<T>(data: T, message: string = "Success"): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message: string, error?: string): ApiResponse {
    return {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
    };
  }

  static paginated<T>(
    data: T[],
    pagination: PaginationMeta,
    message: string = "Success"
  ): ApiResponse<T[]> {
    return {
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    };
  }
}
