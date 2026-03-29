import { useEffect, useState } from "react";
import { useActor } from "../hooks/useActor";

const DEFAULT_DESTINATION =
  "https://rakesh-raja-portfolio-28o.caffeine.xyz/#contact";

export default function TrackPage() {
  const { actor, isFetching } = useActor();
  const [status, setStatus] = useState<"waiting" | "logging" | "redirecting">(
    "waiting",
  );

  const destinationUrl =
    new URLSearchParams(window.location.search).get("url") ??
    DEFAULT_DESTINATION;

  useEffect(() => {
    if (isFetching || !actor) return;

    setStatus("logging");
    const ua = navigator.userAgent;
    const ref = document.referrer;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (actor as any)
      .logVisit(ua, ref, destinationUrl)
      .catch(console.error)
      .finally(() => {
        setStatus("redirecting");
        window.location.href = destinationUrl;
      });
  }, [actor, isFetching, destinationUrl]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm font-sans">
          {status === "redirecting" ? "Redirecting..." : "Loading..."}
        </p>
      </div>
    </div>
  );
}
