"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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

export const description = "An interactive area chart for incident tracking"

const chartConfig = {
  incidents: { label: "Incidents" },
  active: { label: "Active", color: "var(--color-red-500)" },
  resolved: { label: "Resolved", color: "var(--color-green-500)" },
} satisfies ChartConfig

export function IncidentDashboard() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  const incidents = useQuery(api.incidents.listIncidents, { offset: 0, limit: -1 })

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const chartData = React.useMemo(() => {
    if (!incidents) return []

    const groupedData: Record<string, { date: string; active: number; resolved: number }> = {}

    incidents.data.forEach((incident) => {
      const dateStr = incident.reportedDate ? incident.reportedDate.split("T")[0] : new Date().toISOString().split("T")[0]

      if (!groupedData[dateStr]) {
        groupedData[dateStr] = { date: dateStr, active: 0, resolved: 0 }
      }

      if (incident.status === "active" || incident.status === "standby") {
        groupedData[dateStr].active += 1
      } else if (incident.status === "resolved") {
        groupedData[dateStr].resolved += 1
      }
    })

    return Object.values(groupedData).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [incidents])

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
        <CardTitle>Incidents Overview</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Active vs Resolved incidents over time
          </span>
          <span className="@[540px]/card:hidden">Incident trends</span>
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
        {!incidents ? (
          <div className="h-[250px] flex items-center justify-center">
            Loading incident data...
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-active)" stopOpacity={1.0} />
                  <stop offset="95%" stopColor="var(--color-active)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-resolved)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-resolved)" stopOpacity={0.1} />
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
              <Area
                dataKey="resolved"
                type="natural"
                fill="url(#fillResolved)"
                stroke="var(--color-resolved)"
                stackId="a"
              />
              <Area
                dataKey="active"
                type="natural"
                fill="url(#fillActive)"
                stroke="var(--color-active)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
