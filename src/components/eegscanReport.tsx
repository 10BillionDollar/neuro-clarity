import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { fetchEEGMetadata, fetchEEGWindow, fetchEEGClinicalMontage, EEGMetadata, EEGSignals } from "@/app/eeg";
import { Loader2, ChevronLeft, ChevronRight, Activity } from "lucide-react";

const TIME_WINDOW_OPTIONS = [1, 5, 10] as const;
const LINE_COLORS = [
  "#1D4ED8", "#7C3AED", "#2563EB", "#DB2777", "#F59E0B",
  "#10B981", "#6366F1", "#EF4444", "#0EA5E9", "#8B5CF6",
];

export default function EegAnalysis() {
  const [selectedTab, setSelectedTab] = useState<"raw" | "montage">("raw");
  const { jobId } = useParams<{ jobId?: string }>();
  const [windowDuration, setWindowDuration] = useState<number>(1);
  const [windowStart, setWindowStart] = useState<number>(0);
  const [metadata, setMetadata] = useState<EEGMetadata | null>(null);
  const [signals, setSignals] = useState<EEGSignals | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedResultId = jobId ?? "";

  const smoothSignal = (arr: number[], windowSize: number = 5) => {
    return arr.map((_, i) => {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(arr.length, i + Math.ceil(windowSize / 2));
      const slice = arr.slice(start, end);
      return slice.reduce((sum, v) => sum + v, 0) / slice.length;
    });
  };

  // Load metadata when resultId is set
  useEffect(() => {
    if (!selectedResultId) {
      setMetadata(null);
      setSignals(null);
      return;
    }

    setLoadingMetadata(true);
    setMetadata(null);
    setError(null);

    fetchEEGMetadata(selectedResultId)
      .then((data) => {
        setMetadata(data);
        setWindowStart(0);
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load EEG metadata.");
      })
      .finally(() => setLoadingMetadata(false));
  }, [selectedResultId]);

  // Load signals based on selected tab and window
  useEffect(() => {
    if (!selectedResultId || !metadata) {
      setSignals(null);
      return;
    }

    let cancelled = false;

    const loadSignals = async () => {
      setLoadingSignals(true);
      setSignals(null);
      setError(null);

      try {
        const fetcher = selectedTab === "raw" ? fetchEEGWindow : fetchEEGClinicalMontage;
        const data = await fetcher(selectedResultId, windowStart, windowStart + windowDuration);
        if (!cancelled) setSignals(data);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError(`Unable to load ${selectedTab === "raw" ? "raw EEG" : "clinical montage"} data.`);
        }
      } finally {
        if (!cancelled) setLoadingSignals(false);
      }
    };

    loadSignals();
    return () => {
      cancelled = true;
    };
  }, [selectedResultId, selectedTab, metadata, windowStart, windowDuration]);

  const channelKeys = useMemo(() => {
    if (!signals) return [];
    return Object.keys(signals.signals);
  }, [signals]);

  const channelSpacing = 10;
  const chartHeight = Math.max(30 * channelKeys.length, 500);

  const chartData = useMemo(() => {
    if (!signals || !metadata || !channelKeys.length) return [];
    const sampleCount = Math.min(...channelKeys.map((key) => signals.signals[key]?.length ?? 0));

    // Pre-smooth each channel (minimal smoothing to preserve waveform detail)
    const smoothedSignals: Record<string, number[]> = {};
    channelKeys.forEach((channel) => {
      smoothedSignals[channel] = smoothSignal(signals.signals[channel] ?? [], 1);
    });

    const maxRaw = Math.max(
      0.4,
      ...channelKeys.flatMap((channel) =>
        smoothedSignals[channel].map((value) => Math.abs(value)),
      ),
    );
    const amplitudeScale = (channelSpacing * 10) / (maxRaw || 1);

    return Array.from({ length: sampleCount }, (_, index) => {
      const time = index / metadata.sampling_rate;
      const point: Record<string, number> = { time };

      channelKeys.forEach((channel, idx) => {
        const rawValue = smoothedSignals[channel]?.[index] ?? 0;
        point[channel] = rawValue * amplitudeScale + idx * channelSpacing;
      });

      return point;
    });
  }, [signals, metadata, channelKeys, channelSpacing]);

  const maxWindowStart = metadata ? Math.max(metadata.duration_sec - windowDuration, 0) : 0;
  const canGoBack = windowStart > 0;
  const canGoForward = windowStart < maxWindowStart;
  const reversedChannelKeys = useMemo(() => [...channelKeys].reverse(), [channelKeys]);

  return (
    <MainLayout>
      <div className="space-y-6 px-4 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">EEG Signal Viewer</h1>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground pl-11">
              Review raw channel and clinical montage views for this EEG recording.
            </p>
          </div>
        </div>

        {/* Summary stats */}
        {selectedResultId && (
          <Card className="rounded-3xl border-border/60 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-border/50 lg:divide-y-0">
                <Stat label="Sampling Rate" value={metadata ? `${metadata.sampling_rate} Hz` : "—"} accent="text-sky-600 dark:text-sky-400" />
                <Stat label="Duration" value={metadata ? `${metadata.duration_sec.toFixed(0)} sec` : "—"} accent="text-violet-600 dark:text-violet-400" />
                <Stat label="Channels" value={metadata ? String(metadata.channels.length) : "—"} accent="text-emerald-600 dark:text-emerald-400" />
                <Stat
                  label="Window"
                  value={
                    metadata
                      ? `${windowStart.toFixed(0)}s – ${Math.min(windowStart + windowDuration, metadata.duration_sec).toFixed(0)}s`
                      : "—"
                  }
                  accent="text-amber-600 dark:text-amber-400"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-border/50 bg-muted/30 px-5 py-3.5">
                {/* <Badge variant="outline" className="font-mono text-xs">
                  ID: {selectedResultId}
                </Badge> */}
                {metadata?.channels.length ? (
                  <Badge variant="secondary" className="font-normal">
                    {metadata.channels.join(", ")}
                  </Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main viewer */}
        <Card className="rounded-3xl border-border/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as "raw" | "montage")}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="raw">Raw Channels</TabsTrigger>
                  <TabsTrigger value="montage">Clinical Montage</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center rounded-lg border border-border/60 p-0.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    disabled={!selectedResultId || !metadata || !canGoBack}
                    onClick={() => setWindowStart(Math.max(windowStart - windowDuration, 0))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="h-4 w-px bg-border/60" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    disabled={!selectedResultId || !metadata || !canGoForward}
                    onClick={() => setWindowStart(Math.min(windowStart + windowDuration, maxWindowStart))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center rounded-lg border border-border/60 p-0.5">
                  {TIME_WINDOW_OPTIONS.map((duration) => (
                    <Button
                      key={duration}
                      size="sm"
                      variant={windowDuration === duration ? "secondary" : "ghost"}
                      className="h-8 px-3"
                      onClick={() => {
                        setWindowDuration(duration);
                        setWindowStart(0);
                      }}
                    >
                      {duration}s
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {(loadingMetadata || loadingSignals) && (
              <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border/70 bg-muted/20 py-16 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                {loadingMetadata ? "Loading metadata…" : "Loading signal data…"}
              </div>
            )}

            {!selectedResultId && (
              <div className="mt-6 rounded-3xl border border-dashed border-border/70 bg-muted/30 p-10 text-center">
                <Activity className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">No recording selected</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Choose an EEG job to view its signal data.
                </p>
              </div>
            )}

            {selectedResultId && metadata && signals && !loadingMetadata && !loadingSignals && (
              <div className="mt-6 rounded-3xl border border-border/60 bg-background p-4">
                <div className="flex gap-3">
                  {/* Chart area */}
                  <div className="flex-1 overflow-x-auto" style={{ height: `${chartHeight}px` }}>
                    <ChartContainer config={{}} className="h-full w-full">
                      <LineChart data={chartData} margin={{ top: 20, right: 10, left: 12, bottom: 20 }}>
                        <CartesianGrid
                          stroke="rgba(148,163,184,0.18)"
                          vertical
                          horizontal={false}
                          verticalCoordinatesGenerator={(props) => {
                            const { xAxis } = props as any;
                            const ticks: number[] = [];
                            const step = 0.2; // 200ms gridlines for clinical precision
                            for (let t = 0; t <= windowDuration + 1e-6; t += step) {
                              ticks.push(xAxis.scale(t));
                            }
                            return ticks;
                          }}
                        />
                        <XAxis
                          type="number"
                          dataKey="time"
                          domain={[0, windowDuration]}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          ticks={
                            windowDuration <= 1
                              ? [0, 0.2, 0.4, 0.6, 0.8, 1]
                              : [...Array(Math.ceil(windowDuration) + 1)].map((_, i) => i)
                          }
                          label={{
                            value: "Time (s)",
                            position: "insideBottom",
                            offset: -10,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                        />
                        <YAxis
                          hide
                          type="number"
                          domain={[-channelSpacing, channelKeys.length * channelSpacing + channelSpacing]}
                        />
                        <ChartTooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "10px",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                        />
                        {channelKeys.map((channel, idx) => (
                          <Line
                            key={channel}
                            dataKey={channel}
                            dot={false}
                            type="monotone"
                            stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                            strokeWidth={0.5}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            isAnimationActive={false}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ChartContainer>
                  </div>

                  {/* Fixed channel label column */}
                  <div className="flex shrink-0 flex-col justify-start gap-0 border-l border-border/40 pl-3 pt-[4rem] pb-5 pr-1">
                    {reversedChannelKeys.reverse().map((channel, idx) => (
                      <div
                        key={channel}
                        className="mb-[16px] flex items-center gap-1.5 text-[12px] font-semibold leading-none"
                        style={{ height: `${channelSpacing}px` }}
                      >
                        <span
                          className="inline-block h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: LINE_COLORS[(channelKeys.length - 1 - idx) % LINE_COLORS.length] }}
                        />
                        <span
                          className="whitespace-nowrap"
                          style={{ color: LINE_COLORS[(channelKeys.length - 1 - idx) % LINE_COLORS.length] }}
                        >
                          {channel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="space-y-1.5 px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold tabular-nums ${accent ?? ""}`}>{value}</p>
    </div>
  );
}