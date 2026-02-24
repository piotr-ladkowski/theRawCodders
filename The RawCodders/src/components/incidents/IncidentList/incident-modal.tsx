import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconPlus } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react"
import { useMutation } from "convex/react"; 
import { api } from "../../../../convex/_generated/api";
import { useIncidentsContext } from "./incidents-context";

export function IncidentModal() {
  const { selectedIncident, setSelectedIncident, editIncidentModalState, setEditIncidentModalState, setModalObserver } = useIncidentsContext();
  const clearSelectedTimeoutRef = useRef<number | null>(null);

  const createIncident = useMutation(api.incidents.insertIncident);
  const updateIncidentStatus = useMutation(api.incidents.updateIncidentStatus);

  const [status, setStatus] = useState<string>("active");

  useEffect(() => {
    if (selectedIncident) {
      setStatus(selectedIncident.status);
    } else {
      setStatus("active");
    }
  }, [selectedIncident]);

  function scheduleClearSelectedIncident() {
    if (clearSelectedTimeoutRef.current !== null) {
      window.clearTimeout(clearSelectedTimeoutRef.current);
    }
    clearSelectedTimeoutRef.current = window.setTimeout(() => {
      setSelectedIncident(undefined);
    }, 200);
  }

  useEffect(() => {
    return () => {
      if (clearSelectedTimeoutRef.current !== null) {
        window.clearTimeout(clearSelectedTimeoutRef.current);
      }
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      if (selectedIncident?._id) {
        // If editing, we only update the status of the ongoing rescue
        await updateIncidentStatus({
          incidentId: selectedIncident._id,
          status: status as "standby" | "active" | "resolved",
        });
      } else {
        // Creating a new incident
        await createIncident({
          type: formData.get("type") as any,
          status: status as "standby" | "active" | "resolved",
          severityLevel: Number(formData.get("severityLevel")),
          gpsCoordinates: {
            latitude: Number(formData.get("latitude")),
            longitude: Number(formData.get("longitude"))
          },
          weatherConditions: formData.get("weatherConditions") as string,
          reportedDate: new Date().toISOString()
        });
      }
      setModalObserver((prev) => (prev + 1) % 1000);
      setEditIncidentModalState(false); 
      scheduleClearSelectedIncident();
    } catch (error) {
      console.error("Submission failed:", error);
    }
  }
  
  return (
    <Dialog
      open={editIncidentModalState}
      onOpenChange={(open) => {
        setEditIncidentModalState(open);
        if (!open) {
          scheduleClearSelectedIncident();
        }
      }}
    >
        <DialogTrigger asChild>
          <Button>
            <IconPlus className="text-white"/>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm ">
          <form onSubmit={(event) => { void handleSubmit(event); }}>
            <DialogHeader className="mb-4">
              <DialogTitle>{selectedIncident ? "Update Incident Status" : "Report New Incident"}</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              
              {!selectedIncident && (
                <>
                  <Field>
                    <Label htmlFor="type">Incident Type</Label>
                    <Select name="type" defaultValue="Other">
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Avalanche">Avalanche</SelectItem>
                        <SelectItem value="Missing Person">Missing Person</SelectItem>
                        <SelectItem value="Medical Emergency">Medical Emergency</SelectItem>
                        <SelectItem value="Fall / Injury">Fall / Injury</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <Label htmlFor="severityLevel">Severity Level (1-5)</Label>
                    <Input id="severityLevel" name="severityLevel" type="number" min="1" max="5" defaultValue={3} required/>
                  </Field>
                  
                  <div className="flex gap-2">
                    <Field>
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input id="latitude" name="latitude" type="number" step="any" placeholder="49.25" required/>
                    </Field>
                    <Field>
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input id="longitude" name="longitude" type="number" step="any" placeholder="19.98" required/>
                    </Field>
                  </div>

                  <Field>
                    <Label htmlFor="weatherConditions">Current Weather</Label>
                    <Input id="weatherConditions" name="weatherConditions" placeholder="e.g. Heavy Snow, -10C"/>
                  </Field>
                </>
              )}

              <Field>
                <Label htmlFor="status">Mission Status</Label>
                <Select name="status" value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standby">Standby</SelectItem>
                    <SelectItem value="active">Active Rescue</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

            </FieldGroup>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
    </Dialog>
  )
}