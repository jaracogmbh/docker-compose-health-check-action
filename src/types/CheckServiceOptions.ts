export interface CheckServicesOptions {
  maxRetries: number;
  retryInterval: number;
  composeFile: string;
  skipExited: boolean;
  skipNoHealthcheck: boolean;
}
