const ADS_TXT = "google.com, pub-8168876753473960, DIRECT, f08c47fec0942fa0\n";

export function GET() {
  return new Response(ADS_TXT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
