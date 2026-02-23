"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api" // Adjust this path if needed
import { IconTrendingDown, IconTrendingUp, IconMinus } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  // 1. Fetch data from your schema
  const transactions = useQuery(api.transactions.listTransactions, { offset: 0, limit: 50 })
  const clients = useQuery(api.clients.listClients, { offset: 0, limit: 50 }) // You'll need this query in your backend
  const returns = useQuery(api.returns.listReturns, { offset: 0, limit: 50 }) // You'll need this query in your backend

  // 2. Calculate the metrics
  const { totalRevenue, pendingRevenue } = React.useMemo(() => {
    if (!transactions) return { totalRevenue: 0, pendingRevenue: 0 }

    let completed = 0
    let pending = 0

    transactions.forEach((tx) => {
      if (tx.status === "completed") completed += tx.totalPrice
      if (tx.status === "pending") pending += tx.totalPrice
    })

    return { totalRevenue: completed, pendingRevenue: pending }
  }, [transactions])

  const totalClients = clients ? clients.length : 0
  const totalReturns = returns ? returns.length : 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      
      {/* Card 1: Completed Revenue */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue (Completed)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-emerald-600">
              <IconTrendingUp className="mr-1 size-4" />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Steady growth this month <IconTrendingUp className="size-4 text-emerald-600" />
          </div>
          <div className="text-muted-foreground">
            Based on completed transactions
          </div>
        </CardFooter>
      </Card>

      {/* Card 2: Pending Revenue */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Expected Revenue (Pending)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ${pendingRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-yellow-600">
              <IconMinus className="mr-1 size-4" />
              Stable
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            In processing pipeline <IconMinus className="size-4 text-yellow-600" />
          </div>
          <div className="text-muted-foreground">
            Awaiting fulfillment or payment
          </div>
        </CardFooter>
      </Card>

      {/* Card 3: Total Clients */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Clients</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalClients.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-blue-600">
              <IconTrendingUp className="mr-1 size-4" />
              +4.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong acquisition <IconTrendingUp className="size-4 text-blue-600" />
          </div>
          <div className="text-muted-foreground">Registered client accounts</div>
        </CardFooter>
      </Card>

      {/* Card 4: Product Returns */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Product Returns</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalReturns.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-red-600">
              <IconTrendingDown className="mr-1 size-4" />
              -2.1%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Return rate is decreasing <IconTrendingDown className="size-4 text-emerald-600" />
          </div>
          <div className="text-muted-foreground">Needs constant monitoring</div>
        </CardFooter>
      </Card>

    </div>
  )
}