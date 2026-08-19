"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

const COLORS: Record<string, string> = {
  Installed: "var(--status-blue)",
  "In Store": "var(--status-green)",
  Cleaning: "var(--status-purple)",
  Repair: "var(--status-orange)",
};

export function SiteStatusChart({
  installed,
  inStore,
  cleaning,
  repair,
}: {
  installed: number;
  inStore: number;
  cleaning: number;
  repair: number;
}) {
  const data = [
    { name: "Installed", value: installed },
    { name: "In Store", value: inStore },
    { name: "Cleaning", value: cleaning },
    { name: "Repair", value: repair },
  ];

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={76}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? "var(--primary)"} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            style={{ fontSize: 12, fontWeight: 700, fill: "var(--foreground)" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
