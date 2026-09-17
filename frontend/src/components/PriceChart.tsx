import { useEffect, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { PriceHistoryEntry } from "../api/client";
import { useTheme } from "../theme";

interface Props {
  data: PriceHistoryEntry[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

function formatPrice(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function PriceChart({ data }: Props) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const stroke = dark ? "#12b886" : "#0e9f6e";
  const grid = dark ? "#2e2a22" : "#f1ede4";
  const tick = dark ? "#8b8475" : "#8a8172";

  // Measure our own width instead of relying on recharts' ResponsiveContainer,
  // which can render nothing if it first mounts at width 0.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-line text-sm text-faint">
        No price history yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: formatDate(d.checked_at),
    price: d.price,
  }));

  return (
    <div className="rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
      <h3 className="mb-5 font-display text-lg font-semibold tracking-tight text-ink">
        Price history
      </h3>
      <div ref={wrapRef} className="min-h-[280px] w-full">
        {width > 0 && (
          <AreaChart
            width={width}
            height={280}
            data={chartData}
            margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={stroke} stopOpacity={0.18} />
                <stop offset="95%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke={grid} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: tick }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12, fill: tick }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              formatter={(value) => [formatPrice(Number(value)), "Price"]}
              cursor={{ stroke: grid, strokeWidth: 1 }}
              contentStyle={{
                borderRadius: "12px",
                border: `1px solid ${dark ? "#2e2a22" : "#eae4d9"}`,
                background: dark ? "#1e1b16" : "#ffffff",
                color: dark ? "#f4f0e8" : "#191712",
                boxShadow: "0 10px 30px -18px rgba(0,0,0,0.35)",
                fontSize: "13px",
              }}
              labelStyle={{ color: tick }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={stroke}
              strokeWidth={2.5}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{ r: 5, fill: stroke }}
            />
          </AreaChart>
        )}
      </div>
    </div>
  );
}
