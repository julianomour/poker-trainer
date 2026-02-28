export interface HealthStatus {
  status: 'ok';
  timestamp: string;
}

export function getHealth(): HealthStatus {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
}
