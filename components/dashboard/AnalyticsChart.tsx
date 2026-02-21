"use client";

import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart";

const chartConfig = {
    revenue: {
        label: "Revenue",
        color: "hsl(142, 76%, 36%)",
    },
    netProfit: {
        label: "Net Profit",
        color: "hsl(221, 83%, 53%)",
    },
    expenses: {
        label: "Expenses",
        color: "hsl(0, 84%, 60%)",
    },
} satisfies ChartConfig;

interface AnalyticsChartProps {
    data: {
        date: string;
        revenue: number;
        expenses: number;
        netProfit: number;
    }[];
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
    return (
        <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
            <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
                <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="fillNetProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-netProfit)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-netProfit)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                        // Show shortened label, e.g. "Mon" from "Mon, Feb 21"
                        const parts = value.split(" ");
                        return parts[0];
                    }}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `$${value}`}
                    width={60}
                />
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            formatter={(value, name) => {
                                const config = chartConfig[name as keyof typeof chartConfig];
                                return (
                                    <div className="flex items-center justify-between gap-8 w-full">
                                        <span className="text-muted-foreground">{config?.label || name}</span>
                                        <span className="font-mono font-bold tabular-nums">
                                            ${Number(value).toFixed(2)}
                                        </span>
                                    </div>
                                );
                            }}
                        />
                    }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    fill="url(#fillRevenue)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 1 }}
                />
                <Area
                    type="monotone"
                    dataKey="netProfit"
                    stroke="var(--color-netProfit)"
                    strokeWidth={2}
                    fill="url(#fillNetProfit)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 1 }}
                />
                <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="var(--color-expenses)"
                    strokeWidth={2}
                    fill="url(#fillExpenses)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 1 }}
                />
            </AreaChart>
        </ChartContainer>
    );
}
