import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { IconAlertTriangle, IconActivity } from "@tabler/icons-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldGroup } from "@/components/ui/field";
import { Id } from "../../convex/_generated/dataModel";

export function GlobalEmergencyAlert() {
  const incidentsRes = useQuery(api.incidents.listIncidents, { offset: 0, limit: 100 });
  const personnelRes = useQuery(api.personnel.listPersonnel, { offset: 0, limit: 100 });
  const equipmentRes = useQuery(api.equipment.listEquipment, { offset: 0, limit: 100 });

  const insertDispatch = useMutation(api.dispatches.insertDispatch);
  const updateIncidentStatus = useMutation(api.incidents.updateIncidentStatus);

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  
  const [selectedPersonnel, setSelectedPersonnel] = useState<string | undefined>();
  const [selectedEquipment, setSelectedEquipment] = useState<string | undefined>();

  // Safely extract data arrays
  const incidents = Array.isArray(incidentsRes) ? incidentsRes : incidentsRes?.data;
  const personnel = Array.isArray(personnelRes) ? personnelRes : personnelRes?.data;
  const equipment = Array.isArray(equipmentRes) ? equipmentRes : equipmentRes?.data;

  if (!incidents) return null;

  // Find the first "standby" incident that hasn't been locally dismissed by the user
  const activeAlert = incidents.find((i: any) => i.status === "standby" && !dismissed.has(i._id));

  // If there are no standby incidents, don't render anything
  if (!activeAlert) return null;

  const handleDismiss = () => {
    setDismissed((prev) => new Set(prev).add(activeAlert._id));
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonnel && !selectedEquipment) return;

    try {
      // 1. Create the dispatch log
      await insertDispatch({
        incidentId: activeAlert._id,
        personnelId: selectedPersonnel as Id<"personnel"> | undefined,
        equipmentId: selectedEquipment as Id<"equipment"> | undefined,
        dispatchTime: new Date().toISOString(),
      });

      // 2. Change status to "active" (this will automatically hide the banner!)
      await updateIncidentStatus({
        incidentId: activeAlert._id,
        status: "active",
      });

      setDispatchModalOpen(false);
      setSelectedPersonnel(undefined);
      setSelectedEquipment(undefined);
    } catch (error) {
      console.error("Failed quick dispatch:", error);
    }
  };

  return (
    <>
      {/* 1. The Blinking Emergency Banner */}
      <div className="fixed top-0 left-0 w-full z-[100] bg-red-600 animate-pulse text-white shadow-2xl shadow-red-500/50 border-b-4 border-red-800">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <IconAlertTriangle className="h-8 w-8 text-yellow-300 animate-bounce" />
            <div>
              <h2 className="text-lg font-black tracking-widest uppercase">
                New Emergency: {activeAlert.type}
              </h2>
              <p className="text-sm font-semibold text-red-100">
                Severity Level {activeAlert.severityLevel} • Awaiting Immediate Dispatch!
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
              onClick={handleDismiss}
            >
              Acknowledge
            </Button>
            <Button 
              variant="default" 
              className="bg-white text-red-700 hover:bg-gray-200 font-bold border-2 border-white"
              onClick={() => setDispatchModalOpen(true)}
            >
              <IconActivity className="mr-2 h-4 w-4" />
              Assign Resources
            </Button>
          </div>
        </div>
      </div>

      {/* 2. The Quick Dispatch Modal */}
      <Dialog open={dispatchModalOpen} onOpenChange={setDispatchModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handleDispatch}>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-red-600 flex items-center gap-2 text-xl font-bold">
                <IconAlertTriangle /> Quick Dispatch
              </DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label>Incident details</Label>
                <div className="font-bold border p-2 rounded bg-gray-50 dark:bg-gray-800 text-sm">
                  {activeAlert.type} (Severity {activeAlert.severityLevel})<br/>
                  <span className="text-xs text-muted-foreground font-normal">Lat: {activeAlert.gpsCoordinates.latitude.toFixed(4)}, Lng: {activeAlert.gpsCoordinates.longitude.toFixed(4)}</span>
                </div>
              </Field>

              <Field>
                <Label htmlFor="personnelId">Deploy Personnel</Label>
                <Select value={selectedPersonnel} onValueChange={setSelectedPersonnel}>
                  <SelectTrigger id="personnelId">
                    <SelectValue placeholder="Select Available Rescuer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {personnel?.filter((p: any) => p.isAvailable).map((p: any) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name} - {p.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label htmlFor="equipmentId">Deploy Equipment</Label>
                <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                  <SelectTrigger id="equipmentId">
                    <SelectValue placeholder="Select Available Gear..." />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment?.filter((eq: any) => eq.status === "Available").map((eq: any) => (
                      <SelectItem key={eq._id} value={eq._id}>
                        {eq.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold" disabled={!selectedPersonnel && !selectedEquipment}>
                Deploy Now
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}