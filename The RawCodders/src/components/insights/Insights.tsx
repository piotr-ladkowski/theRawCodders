import { useEffect, useState } from "react"
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
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL

interface InsightsData {
  executive_summary: string
  key_findings: Record<string, string>
  recommendations: string[]
  raw_metrics: {
    temporal: Record<string, unknown>
    demographics: Record<string, unknown>
    products: Record<string, unknown>
    transactions: Record<string, unknown>
    returns: Record<string, unknown>
  }
}

export default function Insights() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${AI_SERVICE_URL}/insights`)
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch insights")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [])

  if (loading) return <InsightsSkeleton />
  if (error) return <InsightsError error={error} onRetry={fetchInsights} />

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
            <Button variant="outline" size="sm" onClick={fetchInsights}>
              <IconRefresh className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Executive Summary */}
          {data && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {data.executive_summary}
                  </p>
                </CardContent>
              </Card>

              {/* Metric Cards */}
              <MetricCards metrics={data.raw_metrics} />

              {/* Key Findings */}
              <KeyFindings findings={data.key_findings} />

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
                    {data.recommendations.map((rec, i) => (
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCards({
  metrics,
}: {
  metrics: InsightsData["raw_metrics"]
}) {
  const {demographics, transactions, returns } = metrics

  const cards = [
    {
      title: "Total Transactions",
      value: (transactions as Record<string, unknown>)?.total_transactions ?? "—",
      icon: IconShoppingCart,
    },
    {
      title: "Avg Order Value",
      value:
        (transactions as Record<string, unknown>)?.avg_order_value != null
          ? `$${(transactions as Record<string, unknown>).avg_order_value}`
          : "—",
      icon: IconChartBar,
    },
    {
      title: "Unique Customers",
      value:
        (demographics as Record<string, unknown>)?.total_unique_customers ?? "—",
      icon: IconUsers,
    },
    {
      title: "Repeat Customers",
      value: (demographics as Record<string, unknown>)?.repeat_customers ?? "—",
      icon: IconUsers,
    },
    {
      title: "Avg Basket Size",
      value:
        (transactions as Record<string, unknown>)?.avg_basket_size != null
          ? `${(transactions as Record<string, unknown>).avg_basket_size} items`
          : "—",
      icon: IconShoppingCart,
    },
    {
      title: "Total Returns",
      value: (returns as Record<string, unknown>)?.total_returns ?? "—",
      icon: IconTruckReturn,
    },
    {
      title: "Return Rate",
      value:
        (returns as Record<string, unknown>)?.overall_return_rate != null
          ? `${((returns as Record<string, unknown>).overall_return_rate as number * 100).toFixed(1)}%`
          : "—",
      icon: IconTruckReturn,
    },
    {
      title: "Cancellation Rate",
      value:
        (transactions as Record<string, unknown>)?.cancellation_analysis != null
          ? `${(((transactions as Record<string, unknown>).cancellation_analysis as Record<string, unknown>).cancellation_rate as number * 100).toFixed(1)}%`
          : "—",
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

function KeyFindings({
  findings,
}: {
  findings: Record<string, string>
}) {
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
          {content.split("\n").map((line, i) => {
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
            Make sure the AI service is running at {AI_SERVICE_URL}
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
