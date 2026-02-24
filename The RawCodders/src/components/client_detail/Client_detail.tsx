// src/components/client_detail/Client_detail.tsx
"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { IconArrowLeft, IconCash, IconStar, IconTruckReturn, IconSparkles } from "@tabler/icons-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Spinner } from "@/components/ui/spinner"

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000"

const chartConfig = {
  amount: { label: "Spending ($)", color: "oklch(50.69% .1387 329.4)" },
} satisfies ChartConfig

export default function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()

  const client = useQuery(
    api.clients.getClient,
    clientId ? { clientId: clientId as Id<"clients"> } : "skip"
  )
  const stats = useQuery(
    api.clients.getClientDetailStats,
    clientId ? { clientId: clientId as Id<"clients"> } : "skip"
  )
  
  const updateClient = useMutation(api.clients.updateClient)

  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const generateSummary = async () => {
    if (!client || !stats) return

    setSummaryLoading(true)
    setSummaryError(null)
    try {
      const response = await fetch(`${AI_SERVICE_URL}/client-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: client.name,
          totalSpending: stats.totalSpending,
          totalOrders: stats.totalOrders,
          totalReturns: stats.totalReturns,
          returnRate: stats.returnRate,
          averageRating: stats.averageRating,
          totalRatings: stats.totalRatings,
        }),
      })
      
      if (!response.ok) throw new Error("Failed to generate summary")
      
      const data = await response.json()
      
      // Save it back to Convex DB as a cached value
      await updateClient({ clientId: client._id, aiSummary: data.summary })

    } catch (err) {
      console.error("Failed to fetch client summary:", err)
      setSummaryError("Unable to generate AI summary")
    } finally {
      setSummaryLoading(false)
    }
  }

  if (client === undefined || stats === undefined) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner className="size-12" />
      </div>
    )
  }

  if (client === null) {
    return (
      <div className="container mx-auto px-6 py-6">
        <p className="text-muted-foreground">Client not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/clients")}>
          <IconArrowLeft className="mr-2 size-4" />
          Back to Clients
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header */}
          <div className="flex items-center gap-4 px-4 lg:px-6">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/clients")}>
              <IconArrowLeft className="mr-2 size-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{client.name}</h1>
              <p className="text-sm text-muted-foreground">{client.email}</p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-3">
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Total Spendings</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  ${stats.totalSpending.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  <IconCash className="size-4 text-emerald-600" />
                  Across {stats.totalOrders} order{stats.totalOrders !== 1 ? "s" : ""}
                </div>
                <div className="text-muted-foreground">
                  Based on completed transactions
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Return Rate</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {stats.returnRate.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  <IconTruckReturn className="size-4 text-red-600" />
                  {stats.totalReturns} return{stats.totalReturns !== 1 ? "s" : ""} out of {stats.totalOrders} order{stats.totalOrders !== 1 ? "s" : ""}
                </div>
                <div className="text-muted-foreground">
                  Percentage of orders returned
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Average Rating</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {stats.averageRating !== null
                    ? stats.averageRating.toFixed(1)
                    : "N/A"}
                  {stats.averageRating !== null && (
                    <span className="text-base text-muted-foreground"> / 5</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  <IconStar className="size-4 text-yellow-500" />
                  {stats.totalRatings} rating{stats.totalRatings !== 1 ? "s" : ""} given
                </div>
                <div className="text-muted-foreground">
                  Average across all product reviews
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Spending Over Time Chart */}
          <div className="px-4 lg:px-6">
            <Card className="@container/card">
              <CardHeader>
                <CardTitle>Spending Over Time</CardTitle>
                <CardDescription>
                  Client's completed transaction amounts by date
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                {stats.spendingOverTime.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No spending data available
                  </div>
                ) : (
                  <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                    <AreaChart data={stats.spendingOverTime}>
                      <defs>
                        <linearGradient id="fillSpending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={1.0} />
                          <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0.1} />
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
                          return date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        }}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            labelFormatter={(value) =>
                              new Date(value).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            }
                            indicator="dot"
                          />
                        }
                      />
                      <Area
                        dataKey="amount"
                        type="natural"
                        fill="url(#fillSpending)"
                        stroke="var(--color-amount)"
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Client Summary */}
          <div className="px-4 lg:px-6">
            <Card className="@container/card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex flex-col space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <IconSparkles className="size-5 text-purple-500" />
                    AI Client Summary
                  </CardTitle>
                  <CardDescription>
                    AI-generated overview of this client's activity
                  </CardDescription>
                </div>
                <Button size="sm" onClick={generateSummary} disabled={summaryLoading}>
                  {client.aiSummary ? "Regenerate" : "Generate"}
                </Button>
              </CardHeader>
              <CardContent className="mt-4">
                {summaryLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Spinner className="size-4" />
                    Generating summary…
                  </div>
                ) : summaryError ? (
                  <p className="text-sm text-muted-foreground">{summaryError}</p>
                ) : client.aiSummary ? (
                  <p className="text-sm leading-relaxed">{client.aiSummary}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Click generate to create an AI summary for this client.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}