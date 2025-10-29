import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers["x-api-key"];

    // Simple hardcoded API key for development
    const validApiKey = process.env.API_KEY || "dev-api-key-2024";

    if (!apiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException("Invalid or missing API key");
    }

    return true;
  }
}

