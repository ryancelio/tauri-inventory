export interface ApiListResponse<T> {
  data: T[];
  count: number;
}

export interface ApiResponse {
  response: string;
}
