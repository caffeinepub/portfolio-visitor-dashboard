import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Link,
  Monitor,
  RefreshCw,
  Search,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useAllVisits, useTotalVisitCount } from "../hooks/useQueries";
import { parseUserAgent } from "../utils/parseUA";

const ITEMS_PER_PAGE = 10;
const DEFAULT_DESTINATION =
  "https://rakesh-raja-portfolio-28o.caffeine.xyz/#contact";

function formatTs(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  const d = new Date(ms);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.slice(0, 30);
  }
}

function BrowserIcon({ browser }: { browser: string }) {
  const cls = "w-4 h-4";
  const colors: Record<string, string> = {
    Chrome: "text-yellow-400",
    Firefox: "text-orange-400",
    Safari: "text-blue-400",
    Edge: "text-cyan-400",
    Opera: "text-red-400",
  };
  return (
    <Globe className={`${cls} ${colors[browser] ?? "text-muted-foreground"}`} />
  );
}

function DeviceIcon({ device }: { device: string }) {
  if (device === "Mobile" || device === "Tablet")
    return <Smartphone className="w-4 h-4 text-muted-foreground" />;
  return <Monitor className="w-4 h-4 text-muted-foreground" />;
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<7 | 30>(30);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [copiedGenerated, setCopiedGenerated] = useState(false);
  const [destinationInput, setDestinationInput] = useState(DEFAULT_DESTINATION);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const trackingBase = `${window.location.origin}/track`;

  const { data: visits = [], isLoading, refetch } = useAllVisits();
  const { data: totalCount } = useTotalVisitCount();

  const now = Date.now();
  const oneDayMs = 86_400_000;

  const visitsToday = useMemo(
    () =>
      visits.filter((v) => {
        const ms = Number(v.timestamp / 1_000_000n);
        return now - ms < oneDayMs;
      }),
    [visits, now],
  );

  const visitsWeek = useMemo(
    () =>
      visits.filter((v) => {
        const ms = Number(v.timestamp / 1_000_000n);
        return now - ms < 7 * oneDayMs;
      }),
    [visits, now],
  );

  const chartData = useMemo(() => {
    const days = timeRange;
    const buckets: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * oneDayMs);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = 0;
    }
    for (const v of visits) {
      const ms = Number(v.timestamp / 1_000_000n);
      if (now - ms <= days * oneDayMs) {
        const key = new Date(ms).toISOString().slice(0, 10);
        if (key in buckets) buckets[key]++;
      }
    }
    return Object.entries(buckets).map(([date, count]) => ({
      date: date.slice(5),
      count,
    }));
  }, [visits, timeRange, now]);

  const referrerStats = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of visits) {
      const key = v.referrer || "Direct";
      map[key] = (map[key] ?? 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [visits]);

  const filtered = useMemo(() => {
    const sorted = [...visits].sort((a, b) =>
      Number(b.timestamp - a.timestamp),
    );
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter((v) => {
      const { browser, device } = parseUserAgent(v.userAgent);
      const ref = v.referrer || "Direct";
      const ts = formatTs(v.timestamp);
      const dest = getHostname(v.destinationUrl || "");
      return (
        browser.toLowerCase().includes(q) ||
        device.toLowerCase().includes(q) ||
        ref.toLowerCase().includes(q) ||
        ts.toLowerCase().includes(q) ||
        dest.toLowerCase().includes(q)
      );
    });
  }, [visits, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageData = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedGenerated(true);
      setTimeout(() => setCopiedGenerated(false), 2000);
      toast.success("Tracking link copied!");
    });
  }

  function generateLink() {
    const url = destinationInput.trim();
    if (!url) {
      toast.error("Please enter a destination URL");
      return;
    }
    const trackUrl = `${trackingBase}?url=${encodeURIComponent(url)}`;
    setGeneratedUrl(trackUrl);
  }

  const kpiCards = [
    {
      title: "Total Clicks",
      value:
        totalCount !== undefined ? Number(totalCount).toLocaleString() : "—",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Visits Today",
      value: isLoading ? "—" : visitsToday.length.toLocaleString(),
      icon: Users,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "This Week",
      value: isLoading ? "—" : visitsWeek.length.toLocaleString(),
      icon: Clock,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-base tracking-tight text-foreground">
              PORTFOLIOLY
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-border text-muted-foreground hover:text-foreground"
            onClick={() => refetch()}
            data-ocid="dashboard.secondary_button"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="font-display text-2xl font-bold text-foreground">
            Visitor Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track who clicks any link you share
          </p>
        </motion.div>

        {/* Link Generator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-3"
          data-ocid="dashboard.panel"
        >
          <div className="flex items-center gap-2">
            <Link className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground">
              Generate a Tracking Link
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter any destination URL — every visitor who clicks your tracking
            link will be recorded.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com"
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateLink()}
              className="bg-background border-border text-sm h-9 flex-1"
              data-ocid="dashboard.input"
            />
            <Button
              size="sm"
              className="h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
              onClick={generateLink}
              data-ocid="dashboard.primary_button"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Generate Link
            </Button>
          </div>

          {generatedUrl && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 bg-background border border-border rounded-md px-3 py-2"
            >
              <code className="text-xs text-primary font-mono flex-1 truncate">
                {generatedUrl}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 text-primary hover:text-primary hover:bg-primary/10 shrink-0"
                onClick={() => copyUrl(generatedUrl)}
                data-ocid="tracking.copy_button"
              >
                {copiedGenerated ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                Copy
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpiCards.map((kpi, i) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.07 }}
              data-ocid={`kpi.card.${i + 1}`}
            >
              <Card className="bg-card border-border shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                        {kpi.title}
                      </p>
                      {isLoading && kpi.title !== "Total Clicks" ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        <p className="text-3xl font-display font-bold text-foreground">
                          {kpi.value}
                        </p>
                      )}
                    </div>
                    <div
                      className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}
                    >
                      <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Chart + Referrers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="bg-card border-border shadow-card h-full">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Visits Over Time
                </CardTitle>
                <div className="flex gap-1">
                  {([7, 30] as const).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setTimeRange(r)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                        timeRange === r
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                      data-ocid="chart.tab"
                    >
                      {r} Days
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorCount"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="oklch(0.60 0.18 250)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="oklch(0.60 0.18 250)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="oklch(0.24 0.015 260)"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "oklch(0.72 0.015 260)" }}
                        tickLine={false}
                        axisLine={false}
                        interval={timeRange === 7 ? 0 : 4}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "oklch(0.72 0.015 260)" }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "oklch(0.17 0.015 260)",
                          border: "1px solid oklch(0.24 0.015 260)",
                          borderRadius: "6px",
                          color: "oklch(0.94 0.005 260)",
                          fontSize: 12,
                        }}
                        labelStyle={{ color: "oklch(0.72 0.015 260)" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="oklch(0.60 0.18 250)"
                        strokeWidth={2}
                        fill="url(#colorCount)"
                        dot={false}
                        activeDot={{ r: 4, fill: "oklch(0.60 0.18 250)" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.38 }}
          >
            <Card className="bg-card border-border shadow-card h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Top Referrers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={`ref-skel-${i}`} className="h-8 w-full" />
                    ))}
                  </div>
                ) : referrerStats.length === 0 ? (
                  <div
                    className="text-center py-8"
                    data-ocid="referrers.empty_state"
                  >
                    <p className="text-muted-foreground text-sm">
                      No referrers yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {referrerStats.map(([ref, count], i) => (
                      <div
                        key={ref}
                        className="space-y-1"
                        data-ocid={`referrers.item.${i + 1}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs text-foreground truncate max-w-[140px]">
                              {ref === "Direct" ? "Direct" : getHostname(ref)}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-primary">
                            {count}
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1">
                          <div
                            className="bg-primary h-1 rounded-full transition-all duration-500"
                            style={{
                              width: `${(count / visits.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Visitors Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <Card className="bg-card border-border shadow-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-sm font-semibold text-foreground">
                Recent Visitors
              </CardTitle>
              <div className="relative w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search visitors..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 h-8 text-xs bg-secondary border-border"
                  data-ocid="visitors.search_input"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground pl-6">
                      Timestamp
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Browser
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Device
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Referrer
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Destination
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    ["s1", "s2", "s3", "s4", "s5"].map((sk) => (
                      <TableRow key={sk} className="border-border">
                        <TableCell className="pl-6">
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : pageData.length === 0 ? (
                    <TableRow className="border-border">
                      <TableCell
                        colSpan={5}
                        className="text-center py-12"
                        data-ocid="visitors.empty_state"
                      >
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Users className="w-8 h-8 opacity-30" />
                          <p className="text-sm">No visitors yet</p>
                          <p className="text-xs">
                            Generate a tracking link and share it to start
                            collecting data
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageData.map((visit, i) => {
                      const { browser, device } = parseUserAgent(
                        visit.userAgent,
                      );
                      const ref = visit.referrer || "Direct";
                      const refDisplay =
                        ref === "Direct" ? "Direct" : getHostname(ref);
                      const destDisplay = visit.destinationUrl
                        ? getHostname(visit.destinationUrl)
                        : "—";
                      return (
                        <TableRow
                          key={`${String(visit.timestamp)}-${i}`}
                          className="border-border hover:bg-accent/30 transition-colors"
                          data-ocid={`visitors.row.${(page - 1) * ITEMS_PER_PAGE + i + 1}`}
                        >
                          <TableCell className="pl-6 text-xs text-muted-foreground font-mono">
                            {formatTs(visit.timestamp)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <BrowserIcon browser={browser} />
                              <span className="text-xs text-foreground">
                                {browser}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DeviceIcon device={device} />
                              <span className="text-xs text-foreground">
                                {device}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                ref === "Direct" ? "secondary" : "outline"
                              }
                              className="text-xs font-normal"
                            >
                              {refDisplay}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-xs font-normal text-primary border-primary/30"
                            >
                              {destDisplay}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {!isLoading && filtered.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of{" "}
                    {filtered.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      data-ocid="visitors.pagination_prev"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => Math.abs(p - page) <= 2)
                      .map((p) => (
                        <Button
                          key={p}
                          size="icon"
                          variant={p === page ? "default" : "ghost"}
                          className="w-7 h-7 text-xs"
                          onClick={() => setPage(p)}
                          data-ocid={`visitors.item.${p}`}
                        >
                          {p}
                        </Button>
                      ))}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      data-ocid="visitors.pagination_next"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <footer className="text-center text-xs text-muted-foreground py-4">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </main>
    </div>
  );
}
