import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const clientIP = request.headers.get("x-client-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (clientIP) {
    return clientIP;
  }

  // Fallback to a default identifier if IP can't be determined
  return "unknown";
}

function isRateLimited(clientIP: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIP);

  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize rate limit data
    rateLimitMap.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return false;
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  clientData.count++;
  return false;
}

export function rateLimitMiddleware(request: NextRequest) {
  const clientIP = getClientIP(request);

  if (isRateLimited(clientIP)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  return null; // Continue processing
}

// Clean up old entries periodically (simple cleanup)
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);
