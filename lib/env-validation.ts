// Environment variable validation utility
export function validateEnvironment() {
  const requiredEnvVars = [
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "INVENTREE_URL",
    "INVENTREE_TOKEN",
    "MICROSOFT_CLIENT_ID",
    "MICROSOFT_CLIENT_SECRET",
    "MICROSOFT_TENANT_ID",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`,
    );
  }

  // Validate URLs
  try {
    new URL(process.env.BETTER_AUTH_URL!);
    new URL(process.env.INVENTREE_URL!);
  } catch (error) {
    throw new Error("Invalid URL format in environment variables");
  }

  // Validate token format (basic check)
  if (!process.env.INVENTREE_TOKEN?.startsWith("inv-")) {
    throw new Error("INVENTREE_TOKEN appears to be in invalid format");
  }
}

// Call validation on module load
if (typeof window === "undefined") {
  // Only run on server
  try {
    validateEnvironment();
  } catch (error) {
    console.error("Environment validation failed:", error);
    // In production, you might want to exit the process
    // process.exit(1);
  }
}
