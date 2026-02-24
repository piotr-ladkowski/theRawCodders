import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { Badge } from "@/components/ui/badge"

export default function IncidentMap({ incidents }: { incidents: any[] }) {
  // Center map around the Tatra Mountains
  const mapCenter: [number, number] = [49.25, 19.98]

  // Filter out resolved incidents
  const activeIncidents = incidents?.filter((inc) => inc.status !== "resolved") || []

  return (
    <div className="h-full min-h-[500px] w-full rounded-xl overflow-hidden border">
      <MapContainer
        center={mapCenter}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: "100%", minHeight: "500px", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {activeIncidents.map((incident) => {
          if (!incident.gpsCoordinates) return null;

          // Make Active incidents RED, and Standby incidents ORANGE
          const dotColor = incident.status === "active" ? "#ef4444" : "#f97316";

          return (
            <CircleMarker
              key={incident._id}
              center={[
                incident.gpsCoordinates.latitude,
                incident.gpsCoordinates.longitude,
              ]}
              radius={8}
              pathOptions={{ 
                color: dotColor, 
                fillColor: dotColor, 
                fillOpacity: 0.8,
                weight: 2 
              }}
            >
              <Popup className="min-w-[200px]">
                <div className="flex flex-col gap-2 p-1">
                  <div className="font-bold text-lg border-b pb-1">
                    {incident.type}
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={incident.status === "active" ? "destructive" : "secondary"}>
                      {incident.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Severity:</span>
                    <span className={`font-bold ${incident.severityLevel >= 4 ? "text-red-500" : ""}`}>
                      Level {incident.severityLevel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Weather:</span>
                    <span>{incident.weatherConditions || "Unknown"}</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}