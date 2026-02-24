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
  const incidents = useQuery(api.incidents.listIncidents, { offset: 0, limit: -1 })
  const personnel = useQuery(api.personnel.listPersonnel, { offset: 0, limit: -1 })
  const equipment = useQuery(api.equipment.listEquipment, { offset: 0, limit: -1 })
  const maintenanceLogs = useQuery(api.maintenance_logs.listMaintenanceLogs, { offset: 0, limit: -1 })

  const activeIncidents = React.useMemo(() => {
    if (!incidents) return 0
    return incidents.data.filter((i) => i.status === "active").length
  }, [incidents])

  const totalIncidents = incidents?.count ?? 0

  const availablePersonnel = React.useMemo(() => {
    if (!personnel) return 0
    return personnel.data.filter((p) => p.isAvailable).length
  }, [personnel])

  const totalPersonnel = personnel?.count ?? 0

  const availableEquipment = React.useMemo(() => {
    if (!equipment) return 0
    return equipment.data.filter((e) => e.status === "Available").length
  }, [equipment])

  const totalEquipment = equipment?.total ?? 0

  const totalMaintenanceLogs = maintenanceLogs?.total ?? 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">

      {/* Card 1: Active Incidents */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Incidents</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activeIncidents}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={activeIncidents > 0 ? "text-red-600" : "text-emerald-600"}>
              {activeIncidents > 0 ? <IconTrendingUp className="mr-1 size-4" /> : <IconMinus className="mr-1 size-4" />}
              {activeIncidents > 0 ? "Ongoing" : "Clear"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {totalIncidents} total incidents recorded
          </div>
          <div className="text-muted-foreground">
            Active rescue operations in progress
          </div>
        </CardFooter>
      </Card>

      {/* Card 2: Available Personnel */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Available Rescuers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {availablePersonnel} / {totalPersonnel}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={availablePersonnel > 0 ? "text-emerald-600" : "text-yellow-600"}>
              {availablePersonnel > 0 ? <IconTrendingUp className="mr-1 size-4" /> : <IconTrendingDown className="mr-1 size-4" />}
              {availablePersonnel > 0 ? "Ready" : "Low"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Personnel on standby <IconTrendingUp className="size-4 text-emerald-600" />
          </div>
          <div className="text-muted-foreground">Rescuers available for dispatch</div>
        </CardFooter>
      </Card>

      {/* Card 3: Equipment Status */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Equipment Available</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {availableEquipment} / {totalEquipment}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-blue-600">
              <IconTrendingUp className="mr-1 size-4" />
              Operational
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Gear ready for deployment
          </div>
          <div className="text-muted-foreground">Vehicles, medical, climbing equipment</div>
        </CardFooter>
      </Card>

      {/* Card 4: Maintenance Logs */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Maintenance Logs</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalMaintenanceLogs}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-yellow-600">
              <IconMinus className="mr-1 size-4" />
              Tracked
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Equipment maintenance records
          </div>
          <div className="text-muted-foreground">Repairs and inspections logged</div>
        </CardFooter>
      </Card>

    </div>
  )
}
