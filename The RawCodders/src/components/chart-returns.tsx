"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

const chartConfig = {
  returns: { label: "Returns", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig

export function ReturnsDashboard() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  const returnsWithDates = useQuery(api.returns.listReturnsWithDates)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const chartData = React.useMemo(() => {
    if (!returnsWithDates) return []

    const groupedData: Record<string, { date: string; returns: number }> = {}

    returnsWithDates.forEach((ret) => {
      const dateStr = ret.date ? ret.date.split("T")[0] : new Date().toISOString().split("T")[0]

      if (!groupedData[dateStr]) {
        groupedData[dateStr] = { date: dateStr, returns: 0 }
      }

      groupedData[dateStr].returns += 1
    })

    return Object.values(groupedData).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [returnsWithDates])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Returns Over Time</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Number of product returns by date
          </span>
          <span className="@[540px]/card:hidden">Returns trends</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
              <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {!returnsWithDates ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Loading returns data...
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <BarChart data={filteredData}>
              <defs>
                <linearGradient id="fillReturns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-returns)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-returns)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Bar
                dataKey="returns"
                fill="url(#fillReturns)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
