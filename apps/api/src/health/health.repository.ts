export interface HealthRepository {
  checkDatabaseConnection(): Promise<void>;
}
