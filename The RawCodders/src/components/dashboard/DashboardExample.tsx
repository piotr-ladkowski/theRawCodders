import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconActivity, IconAlertTriangle, IconBackpack, IconUsersGroup } from "@tabler/icons-react"
import IncidentMap from "./IncidentMap"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardExample() {
  // Fetch real-time data from Convex
  const incidentsQuery = useQuery(api.incidents.listIncidents, { limit: 100 })
  const personnelQuery = useQuery(api.personnel.listPersonnel, { limit: 100 })
  const equipmentQuery = useQuery(api.equipment.listEquipment, { limit: 100 })

  if (!incidentsQuery || !personnelQuery || !equipmentQuery) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    )
  }

  // Calculate top-level operational metrics
  const incidents = incidentsQuery.data || incidentsQuery
  const personnel = personnelQuery.data || personnelQuery
  const equipment = equipmentQuery.data || equipmentQuery

  const activeIncidents = incidents.filter((i: any) => i.status === "active").length
  const standbyIncidents = incidents.filter((i: any) => i.status === "standby").length
  
  const availablePersonnel = personnel.filter((p: any) => p.isAvailable).length
  const activePersonnel = personnel.length - availablePersonnel

  const equipInUse = equipment.filter((e: any) => e.status === "In Use").length
  const equipMaintenance = equipment.filter((e: any) => e.status === "Maintenance").length

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6 w-full max-w-full overflow-hidden">
      
      {/* 1. Tactical Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ongoing Rescues</CardTitle>
            <IconActivity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{activeIncidents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              + {standbyIncidents} incidents on standby
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Personnel</CardTitle>
            <IconUsersGroup className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availablePersonnel}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activePersonnel} personnel currently deployed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Equipment Dispatched</CardTitle>
            <IconBackpack className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipInUse}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {equipment.length - equipInUse - equipMaintenance} items ready at base
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gear Maintenance</CardTitle>
            <IconAlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{equipMaintenance}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Items require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* 2. Interactive Map (Takes up 2 columns) */}
        <Card className="col-span-3 lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Live Incident Map</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[500px]">
            <IncidentMap incidents={incidents} />
          </CardContent>
        </Card>

        {/* 3. Recent Incidents Feed (Takes up 1 column) */}
        <Card className="col-span-3 lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Recent Dispatch Feed</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[500px]">
            <div className="space-y-4">
              {incidents.slice(0, 10).map((incident: any) => (
                <div key={incident._id} className="flex flex-col border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm">{incident.type}</span>
                    <Badge variant={incident.status === "active" ? "destructive" : incident.status === "standby" ? "secondary" : "default"}>
                      {incident.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                    <span>Sev: {incident.severityLevel}/5</span>
                    <span>{new Date(incident.reportedDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}