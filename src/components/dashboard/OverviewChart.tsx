'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

const chartConfig = {
  presupuestos: {
    label: "Presupuestos",
    color: "hsl(var(--chart-1))",
  },
  ingresos: {
    label: "Ingresos (CLP)",
    color: "hsl(var(--chart-2))",
  },
}

export function OverviewChart({ data, hideIngresos = false }: { data: any[], hideIngresos?: boolean }) {
  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis 
          dataKey="month" 
          tickLine={false} 
          tickMargin={10} 
          axisLine={false} 
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {!hideIngresos && <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={4} />}
        <Bar dataKey="presupuestos" fill="var(--color-presupuestos)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
