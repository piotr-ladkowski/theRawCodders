import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  IconBrain,
  IconRefresh,
  IconChartBar,
  IconUsers,
  IconShoppingCart,
  IconTruckReturn,
  IconClock,
  IconDownload,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { IconSpeakerphone } from "@tabler/icons-react"

// Updated to use the environment variable we set up earlier
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000"

export default function Insights() {
  // Read from Convex
  const latestInsight = useQuery(api.insights.getLatest)
  const saveInsight = useMutation(api.insights.save)

  // Local state for the generation process
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateInsights = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      // 1. Ask Python service to generate the report
      const res = await fetch(`${AI_SERVICE_URL}/insights`)
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const json = await res.json()
      
      // 2. Save it directly into the Convex database
      await saveInsight({
        executive_summary: json.executive_summary,
        key_findings: json.key_findings,
        recommendations: json.recommendations,
        marketing_actions: json.marketing_actions,
        raw_metrics: json.raw_metrics,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate insights")
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadReport = async () => {
    if (!latestInsight) return
    setIsDownloading(true)
    try {
      const res = await fetch(`${AI_SERVICE_URL}/insights/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          executive_summary: latestInsight.executive_summary,
          key_findings: latestInsight.key_findings,
          recommendations: latestInsight.recommendations,
          raw_metrics: latestInsight.raw_metrics,
        }),
      })
      
      if (!res.ok) throw new Error("Failed to generate PDF")
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Insights_Report_${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error(err)
      // Optional: show a toast error
    } finally {
      setIsDownloading(false)
    }
  }

  // Still loading the initial state from Convex
  if (latestInsight === undefined) return <InsightsSkeleton />

  // If there's an error during generation, we handle it here but still show old data if it exists
  if (error && !latestInsight) return <InsightsError error={error} onRetry={generateInsights} />

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconBrain className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  AI Insights
                </h1>
                <p className="text-muted-foreground text-sm">
                  Automated business intelligence powered by GPT-4o
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={downloadReport}
                disabled={!latestInsight || isDownloading || isGenerating}
              >
                <IconDownload className={`mr-2 h-4 w-4 ${isDownloading ? "animate-pulse" : ""}`} />
                {isDownloading ? "Generating PDF..." : "Download Report"}
              </Button>
              <Button 
                onClick={generateInsights} 
                disabled={isGenerating}
              >
                <IconRefresh className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                {isGenerating ? "Analyzing Data..." : "Generate New Analysis"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm mb-4">
              Error generating new insight: {error}
            </div>
          )}

          {/* Empty State */}
          {latestInsight === null && !isGenerating && (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl mt-4">
              <IconBrain className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">No Insights Found</h3>
              <p className="text-muted-foreground text-sm max-w-sm text-center mb-4">
                You haven't generated any AI insights yet. Click the button below to analyze your store data.
              </p>
              <Button onClick={generateInsights}>Run Initial Analysis</Button>
            </div>
          )}

          {/* Data State */}
          {latestInsight && (
            <div className={isGenerating ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
              <div className="flex justify-between items-center mb-4">
                 <p className="text-xs text-muted-foreground">
                   Last generated: {new Date(latestInsight._creationTime).toLocaleString()}
                 </p>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {latestInsight.executive_summary}
                  </p>
                </CardContent>
              </Card>

              {/* Metric Cards */}
              <div className="mb-6">
                 <MetricCards metrics={latestInsight.raw_metrics} />
              </div>

              {/* Key Findings */}
              <div className="mb-6">
                 <KeyFindings findings={latestInsight.key_findings} />
              </div>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Actionable Recommendations</CardTitle>
                  <CardDescription>
                    Prioritized steps to improve business performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2">
                    {latestInsight.recommendations.map((rec: string, i: number) => (
                      <li
                        key={i}
                        className="text-sm leading-relaxed text-muted-foreground"
                      >
                        {rec}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {/* Marketing Actions */}
              {latestInsight.marketing_actions && latestInsight.marketing_actions.length > 0 && (
                <Card className={'mt-6'}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <IconSpeakerphone className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>Marketing Actions</CardTitle>
                        <CardDescription>
                          AI-proposed campaign ideas based on your data patterns
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {latestInsight.marketing_actions.map((action: string, i: number) => (
                        <div
                          key={i}
                          className="rounded-lg border p-4 space-y-1"
                        >
                          <div className="flex items-start gap-2">
                            <Badge variant="secondary" className="shrink-0 mt-0.5">
                              {i + 1}
                            </Badge>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {renderInlineBold(action)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function MetricCards({ metrics }: { metrics: any }) {
  const {demographics, transactions, returns } = metrics || {}

  const cards = [
    {
      title: "Total Transactions",
      value: transactions?.total_transactions ?? "—",
      icon: IconShoppingCart,
    },
    {
      title: "Avg Order Value",
      value: transactions?.avg_order_value != null ? `$${transactions.avg_order_value}` : "—",
      icon: IconChartBar,
    },
    {
      title: "Unique Customers",
      value: demographics?.total_unique_customers ?? "—",
      icon: IconUsers,
    },
    {
      title: "Repeat Customers",
      value: demographics?.repeat_customers ?? "—",
      icon: IconUsers,
    },
    {
      title: "Avg Basket Size",
      value: transactions?.avg_basket_size != null ? `${transactions.avg_basket_size} items` : "—",
      icon: IconShoppingCart,
    },
    {
      title: "Total Returns",
      value: returns?.total_returns ?? "—",
      icon: IconTruckReturn,
    },
    {
      title: "Return Rate",
      value: returns?.overall_return_rate != null ? `${(returns.overall_return_rate * 100).toFixed(1)}%` : "—",
      icon: IconTruckReturn,
    },
    {
      title: "Cancellation Rate",
      value: transactions?.cancellation_analysis != null ? `${(transactions.cancellation_analysis.cancellation_rate * 100).toFixed(1)}%` : "—",
      icon: IconClock,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{String(card.value)}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function KeyFindings({ findings }: { findings: any }) {
  const content = findings?.narrative || JSON.stringify(findings, null, 2)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Findings</CardTitle>
        <CardDescription>
          Statistical analysis of your business data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {content.split("\n").map((line: string, i: number) => {
            const trimmed = line.trim()
            if (!trimmed) return null

            // Detect sub-headings (bold text like **Category**)
            const headingMatch = trimmed.match(/^\*\*(.+?)\*\*$/)
            if (headingMatch) {
              return (
                <h4 key={i} className="mt-4 mb-2 font-semibold text-foreground">
                  {headingMatch[1]}
                </h4>
              )
            }

            // Detect bullet points
            if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
              return (
                <div key={i} className="flex gap-2 text-sm text-muted-foreground ml-2">
                  <span>•</span>
                  <span>{renderInlineBold(trimmed.slice(2))}</span>
                </div>
              )
            }

            return (
              <p key={i} className="text-sm text-muted-foreground">
                {renderInlineBold(trimmed)}
              </p>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function renderInlineBold(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="text-foreground">
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

function InsightsSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function InsightsError({
  error,
  onRetry,
}: {
  error: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col items-center justify-center gap-4 py-20 px-4">
          <IconBrain className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Unable to load insights</h2>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {error}
          </p>
          <Badge variant="outline" className="text-xs">
            Make sure the AI service is running at {import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000"}
          </Badge>
          <Button variant="outline" onClick={onRetry}>
            <IconRefresh className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}