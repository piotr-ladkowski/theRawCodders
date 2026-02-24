
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Badge } from "@/components/ui/badge"

// Fix for Leaflet's default marker icons in Vite/React
const customMarker = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function IncidentMap({ incidents }: { incidents: any[] }) {
  // Center map around the Tatra Mountains (approx where we seeded data)
  const mapCenter: [number, number] = [49.25, 19.98]

  // Filter out resolved incidents so we only see active/standby ones on the map
  const activeIncidents = incidents?.filter((inc) => inc.status !== "resolved") || []

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border">
      <MapContainer
        center={mapCenter}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        {/* OpenStreetMap Base Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {activeIncidents.map((incident) => {
          if (!incident.gpsCoordinates) return null;

          return (
            <Marker
              key={incident._id}
              position={[
                incident.gpsCoordinates.latitude,
                incident.gpsCoordinates.longitude,
              ]}
              icon={customMarker}
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
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}