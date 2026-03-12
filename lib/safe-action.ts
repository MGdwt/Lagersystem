import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    // Log the full error for debugging (server-side only)
    console.error("Server action error:", e);

    // Return a generic error message to the client to avoid leaking sensitive information
    if (e instanceof Error) {
      // Check for specific error types that are safe to expose
      if (e.message.includes("Server ENV fehlt")) {
        return "Server configuration error. Please contact support.";
      }
      if (e.message.includes("Kein Part")) {
        return e.message; // Business logic errors are safe to expose
      }
      if (e.message.includes("Bestand wäre negativ")) {
        return e.message; // Business logic errors are safe to expose
      }
      if (e.message.includes("InvenTree")) {
        return "External service error. Please try again later.";
      }
    }

    // Generic error for all other cases
    return "An unexpected error occurred. Please try again.";
  },
});
