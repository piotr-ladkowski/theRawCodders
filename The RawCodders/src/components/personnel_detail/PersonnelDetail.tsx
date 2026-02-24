"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { IconArrowLeft, IconMountain, IconStar, IconShield, IconSparkles } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000"

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
          certifications: person.certifications,
          totalMissions: stats.totalMissions,
          activeMissions: stats.activeMissions,
          resolvedMissions: stats.resolvedMissions,
          averageDifficulty: stats.averageDifficulty,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate summary")

      const data = await response.json()

      await updatePersonnel({ personnelId: person._id, aiProfileSummary: data.summary })
    } catch (err) {
      console.error("Failed to fetch personnel summary:", err)
      setSummaryError("Unable to generate AI summary")
    } finally {
      setSummaryLoading(false)
    }
  }

  if (person === undefined || stats === undefined) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner className="size-12" />
      </div>
    )
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
              <IconArrowLeft className="mr-2 size-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{person.name}</h1>
              <p className="text-sm text-muted-foreground">{person.email} · {person.role}</p>
            </div>
            <Badge variant={person.isAvailable ? "default" : "destructive"} className="ml-auto">
              {person.isAvailable ? "Available" : "Unavailable"}
            </Badge>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-3">
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Total Missions</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {stats.totalMissions}
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  <IconMountain className="size-4 text-blue-600" />
                  {stats.activeMissions} active, {stats.resolvedMissions} resolved
                </div>
                <div className="text-muted-foreground">
                  Based on dispatch records
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Certifications</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {person.certifications.length}
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  <IconShield className="size-4 text-emerald-600" />
                  {person.certifications.join(", ")}
                </div>
                <div className="text-muted-foreground">
                  Active certifications
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Avg Mission Difficulty</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {stats.averageDifficulty !== null
                    ? stats.averageDifficulty.toFixed(1)
                    : "N/A"}
                  {stats.averageDifficulty !== null && (
                    <span className="text-base text-muted-foreground"> / 5</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  <IconStar className="size-4 text-yellow-500" />
                  {stats.totalReports} mission report{stats.totalReports !== 1 ? "s" : ""} filed
                </div>
                <div className="text-muted-foreground">
                  Average difficulty across all missions
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>Personnel Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="ml-2">{person.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Base Station:</span>
                    <span className="ml-2">{person.baseStation}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Role:</span>
                    <span className="ml-2">{person.role}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Summary */}
          <div className="px-4 lg:px-6">
            <Card className="@container/card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex flex-col space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <IconSparkles className="size-5 text-purple-500" />
                    AI Profile Summary
                  </CardTitle>
                  <CardDescription>
                    AI-generated overview of this team member
                  </CardDescription>
                </div>
                <Button size="sm" onClick={generateSummary} disabled={summaryLoading}>
                  {person.aiProfileSummary ? "Regenerate" : "Generate"}
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
                ) : person.aiProfileSummary ? (
                  <p className="text-sm leading-relaxed">{person.aiProfileSummary}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Click generate to create an AI summary for this team member.
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
