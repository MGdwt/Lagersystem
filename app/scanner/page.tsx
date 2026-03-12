import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ScannerClient from "./ScannerClient";

export default async function ScannerPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  return <ScannerClient />;
}
