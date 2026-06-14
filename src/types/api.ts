export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type ApiSuccessResponse<T = Record<string, unknown>> = {
    status: 'ok';
    message: string;
    data?: T;
};

export type ApiErrorResponse = {
    status: 'error';
    message: string;
    errors?: Record<string, string[] | string>;
    data?: Record<string, unknown>;
};

export type ApiResult<T = Record<string, unknown>> =
    | {
          ok: true;
          status: number;
          message: string;
          data?: T;
      }
    | {
          ok: false;
          status: number;
          message: string;
          errors?: Record<string, string[]>;
          data?: Record<string, unknown>;
      };
