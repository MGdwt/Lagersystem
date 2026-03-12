"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusDisplayProps {
  infoTitle: string;
  infoBody: string;
}

export function StatusDisplay({ infoTitle, infoBody }: StatusDisplayProps) {
  return (
    <Card className="border-black/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-base tracking-tight">Status</CardTitle>
        <p className="text-xs text-muted-foreground">
          Hier siehst du das Ergebnis der letzten Aktion.
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-black/10 bg-[#fafafa] p-4">
          <div className="text-sm font-semibold">{infoTitle}</div>
          <div className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
            {infoBody}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
