import { Injectable } from "@nestjs/common";

export interface HealthCheckResponse {
  status: "ok";
  timestamp: string;
}

@Injectable()
export class AppService {
  getHealth(): HealthCheckResponse {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
