export interface FailedResponse {
  errorType: string;
  errorMessage: string;
  errorDetails: { [_: string]: string[] };
}
