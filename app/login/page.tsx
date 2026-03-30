"use client";
// hello
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function loginMicrosoft() {
    setLoading(true);

    const { error } = await authClient.signIn.social({
      provider: "microsoft",
      callbackURL: "/scannerpage",
    });

    if (error) {
      setLoading(false);
      alert(error.message ?? "Login fehlgeschlagen");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#fafafa",
      }}
    >
      <div
        style={{
          background: "white",
          padding: 24,
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 18 }}>Login IT-Support</h1>

        <button
          onClick={loginMicrosoft}
          disabled={loading}
          style={{
            marginTop: 12,
            background: "#03165E",
            color: "white",
            padding: "12px 14px",
            borderRadius: 12,
            border: "none",
            fontWeight: 700,
            width: "100%",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Weiterleitung…" : "Mit Microsoft anmelden"}
        </button>
      </div>
    </main>
  );
}
