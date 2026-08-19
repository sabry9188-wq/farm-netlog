"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  "In Store": "var(--status-green)",
  Installed: "var(--status-blue)",
  Cleaning: "var(--status-purple)",
  Repair: "var(--status-orange)",
  Damaged: "var(--status-red)",
  Lost: "var(--status-grey)",
  Disposed: "var(--status-grey)",
};

export function StatusDonutChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const shown = data.filter((d) => d.value > 0);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
      <div className="relative h-[220px] w-[220px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={shown.length ? shown : data}
              dataKey="value"
              nameKey="name"
              innerRadius={64}
              outerRadius={92}
              paddingAngle={shown.length > 1 ? 3 : 0}
              stroke="none"
            >
              {(shown.length ? shown : data).map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "var(--primary)"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs font-medium text-muted-foreground">Total Nets</p>
          <p className="font-mono text-3xl font-bold tabular-nums text-foreground">{total}</p>
        </div>
      </div>

      <div className="flex w-full max-w-[220px] flex-col gap-2 text-sm">
        {data.map((d) => {
          const pct = total ? Math.round((d.value / total) * 100) : 0;
          return (
            <div key={d.name} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: STATUS_COLORS[d.name] ?? "var(--primary)" }}
              />
              <span className="text-muted-foreground">{d.name}</span>
              <span className="ml-auto shrink-0 font-mono font-semibold text-foreground">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
