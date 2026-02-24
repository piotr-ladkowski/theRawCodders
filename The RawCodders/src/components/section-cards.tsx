"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
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
  const incidents = useQuery(api.incidents.listIncidents, { offset: 0, limit: 5000 })
  const personnel = useQuery(api.personnel.listPersonnel, { offset: 0, limit: 5000 })
  const equipment = useQuery(api.equipment.listEquipment, { offset: 0, limit: 5000 })

  const { totalMissions, activeMissions, resolvedMissions } = React.useMemo(() => {
    if (!incidents) return { totalMissions: 0, activeMissions: 0, resolvedMissions: 0 }

    let active = 0
    let resolved = 0

    incidents.incidents.forEach((inc) => {
      if (inc.status === "active") active++
      if (inc.status === "resolved") resolved++
    })

    return { totalMissions: incidents.count, activeMissions: active, resolvedMissions: resolved }
  }, [incidents])

  const availablePersonnel = React.useMemo(() => {
    if (!personnel) return 0
    return personnel.data.filter((p) => p.isAvailable).length
  }, [personnel])

  const maintenanceEquipment = React.useMemo(() => {
    if (!equipment) return 0
    return equipment.data.filter((e) => e.status === "Maintenance").length
  }, [equipment])

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      
      {/* Card 1: Total Missions */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Missions</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalMissions.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-emerald-600">
              <IconTrendingUp className="mr-1 size-4" />
              Active: {activeMissions}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {resolvedMissions} resolved missions <IconTrendingUp className="size-4 text-emerald-600" />
          </div>
          <div className="text-muted-foreground">
            All recorded rescue incidents
          </div>
        </CardFooter>
      </Card>

      {/* Card 2: Active Incidents */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Incidents</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activeMissions.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-yellow-600">
              <IconMinus className="mr-1 size-4" />
              In Progress
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Ongoing operations <IconMinus className="size-4 text-yellow-600" />
          </div>
          <div className="text-muted-foreground">
            Incidents requiring active response
          </div>
        </CardFooter>
      </Card>

      {/* Card 3: Available Personnel */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Available Personnel</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {availablePersonnel.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-blue-600">
              <IconTrendingUp className="mr-1 size-4" />
              Ready
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Team members on standby <IconTrendingUp className="size-4 text-blue-600" />
          </div>
          <div className="text-muted-foreground">Personnel available for deployment</div>
        </CardFooter>
      </Card>

      {/* Card 4: Equipment in Maintenance */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Equipment in Maintenance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {maintenanceEquipment.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-red-600">
              <IconTrendingDown className="mr-1 size-4" />
              Under Repair
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Equipment needing attention <IconTrendingDown className="size-4 text-red-600" />
          </div>
          <div className="text-muted-foreground">Needs constant monitoring</div>
        </CardFooter>
      </Card>

    </div>
  )
}