"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { IconArrowLeft, IconSend, IconSparkles } from "@tabler/icons-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://majkrafty.ddns.net:18020/"

const chartConfig = {
  amount: { label: "Missions", color: "oklch(50.69% .1387 329.4)" },
} satisfies ChartConfig

export default function PersonnelDetail() {
  const { personnelId } = useParams<{ personnelId: string }>()
  const navigate = useNavigate()

  const person = useQuery(
    api.personnel.getPersonnel,
    personnelId ? { personnelId: personnelId as Id<"personnel"> } : "skip"
  )
  const stats = useQuery(
    api.personnel.getPersonnelDetailStats,
    personnelId ? { personnelId: personnelId as Id<"personnel"> } : "skip"
  )

  const updatePersonnel = useMutation(api.personnel.updatePersonnel)

  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const generateSummary = async () => {
    if (!person || !stats) return
    setSummaryLoading(true)
    setSummaryError(null)
    try {
      const response = await fetch(`${AI_SERVICE_URL}/client-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: person.name,
          role: person.role,
          totalMissions: stats.totalMissions,
          certifications: person.certifications,
          baseStation: person.baseStation,
        }),
      })
      if (!response.ok) throw new Error("Failed to generate summary")
      const data = await response.json()
      await updatePersonnel({ personnelId: person._id, aiProfileSummary: data.summary })
    } catch (err) {
      console.error("Failed to fetch summary:", err)
      setSummaryError("Unable to generate AI summary")
    } finally {
      setSummaryLoading(false)
    }
  }

  if (person === undefined || stats === undefined) {
    return <div className="flex justify-center items-center h-full"><Spinner className="size-12" /></div>
  }

  if (person === null) {
    return (
      <div className="container mx-auto px-6 py-6">
        <p className="text-muted-foreground">Personnel not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/personnel")}>
          <IconArrowLeft className="mr-2 size-4" />
          Back to Personnel
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
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/personnel")}>
              <IconArrowLeft className="mr-2 size-4" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{person.name}</h1>
              <p className="text-sm text-muted-foreground">{person.email} | {person.role}</p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Total Missions</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums">{stats.totalMissions}</CardTitle>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  <IconSend className="size-4 text-blue-600" /> Dispatched missions
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Base Station</CardDescription>
                <CardTitle className="text-2xl font-semibold">{person.baseStation}</CardTitle>
              </CardHeader>
              <CardFooter className="text-sm text-muted-foreground">Primary assignment location</CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Availability</CardDescription>
                <CardTitle className="text-2xl font-semibold">
                  <Badge variant={person.isAvailable ? "default" : "destructive"}>
                    {person.isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardFooter className="text-sm text-muted-foreground">
                Certifications: {person.certifications.join(", ") || "None"}
              </CardFooter>
            </Card>
          </div>

          {/* Missions Over Time Chart */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>Missions Over Time</CardTitle>
                <CardDescription>Number of dispatched missions by date</CardDescription>
              </CardHeader>
              <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                {stats.missionsOverTime.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No mission data available
                  </div>
                ) : (
                  <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                    <AreaChart data={stats.missionsOverTime}>
                      <defs>
                        <linearGradient id="fillMissions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={1.0} />
                          <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32}
                        tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                      <ChartTooltip cursor={false} content={
                        <ChartTooltipContent labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} indicator="dot" />
                      } />
                      <Area dataKey="amount" type="natural" fill="url(#fillMissions)" stroke="var(--color-amount)" />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Profile Summary */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex flex-col space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <IconSparkles className="size-5 text-purple-500" />
                    AI Personnel Profile
                  </CardTitle>
                  <CardDescription>AI-generated overview of this team member</CardDescription>
                </div>
                <Button size="sm" onClick={generateSummary} disabled={summaryLoading}>
                  {person.aiProfileSummary ? "Regenerate" : "Generate"}
                </Button>
              </CardHeader>
              <CardContent className="mt-4">
                {summaryLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground"><Spinner className="size-4" /> Generating...</div>
                ) : summaryError ? (
                  <p className="text-sm text-muted-foreground">{summaryError}</p>
                ) : person.aiProfileSummary ? (
                  <p className="text-sm leading-relaxed">{person.aiProfileSummary}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Click generate to create an AI profile.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
