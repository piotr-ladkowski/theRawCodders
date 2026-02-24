import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { IconAlertTriangle, IconActivity, IconBrain, IconLoader2 } from "@tabler/icons-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldGroup } from "@/components/ui/field";
import { Id } from "../../convex/_generated/dataModel";

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000";

interface DispatchRecommendation {
  recommended_personnel: string[];
  recommended_equipment: string[];
  rationale: string;
}

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

  const [recommendation, setRecommendation] = useState<DispatchRecommendation | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  // Safely extract data arrays
  const incidents = Array.isArray(incidentsRes) ? incidentsRes : incidentsRes?.data;
  const personnel = Array.isArray(personnelRes) ? personnelRes : personnelRes?.data;
  const equipment = Array.isArray(equipmentRes) ? equipmentRes : equipmentRes?.data;

  // Find the first "standby" incident that hasn't been locally dismissed by the user
  const activeAlert = incidents?.find((i: any) => i.status === "standby" && !dismissed.has(i._id));

  const availablePersonnel = personnel?.filter((p: any) => p.isAvailable) ?? [];
  const availableEquipment = equipment?.filter((eq: any) => eq.status === "Available") ?? [];

  const fetchRecommendation = useCallback(async () => {
    console.log("[QuickDispatch] fetchRecommendation called", {
      hasActiveAlert: !!activeAlert,
      activeAlertId: activeAlert?._id,
      activeAlertType: activeAlert?.type,
      availablePersonnelCount: availablePersonnel.length,
      availableEquipmentCount: availableEquipment.length,
    });

    if (!activeAlert || (availablePersonnel.length === 0 && availableEquipment.length === 0)) {
      console.warn("[QuickDispatch] Skipping fetch: no alert or no available resources");
      return;
    }

    setRecommendationLoading(true);
    setRecommendationError(null);
    setRecommendation(null);

    const requestBody = {
      incident_type: activeAlert.type,
      severity_level: activeAlert.severityLevel,
      gps_coordinates: {
        latitude: activeAlert.gpsCoordinates.latitude,
        longitude: activeAlert.gpsCoordinates.longitude,
      },
      weather_conditions: activeAlert.weatherConditions ?? null,
      available_personnel: availablePersonnel.map((p: any) => ({
        name: p.name,
        role: p.role,
        certifications: p.certifications ?? [],
      })),
      available_equipment: availableEquipment.map((eq: any) => ({
        name: eq.name,
        category: eq.category ?? "",
      })),
    };

    console.log("[QuickDispatch] POST /dispatch-recommendation", {
      url: `${AI_SERVICE_URL}/dispatch-recommendation`,
      body: requestBody,
    });

    try {
      const res = await fetch(`${AI_SERVICE_URL}/dispatch-recommendation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("[QuickDispatch] Response status:", res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[QuickDispatch] Error response body:", errorText);
        throw new Error(`AI service returned ${res.status}: ${errorText}`);
      }

      const data: DispatchRecommendation = await res.json();
      console.log("[QuickDispatch] Recommendation received:", data);
      setRecommendation(data);
    } catch (err) {
      console.error("[QuickDispatch] Dispatch recommendation failed:", err);
      setRecommendationError("Could not load AI recommendation.");
    } finally {
      setRecommendationLoading(false);
    }
  }, [activeAlert?._id, availablePersonnel.length, availableEquipment.length]);

  useEffect(() => {
    if (dispatchModalOpen) {
      fetchRecommendation();
    } else {
      setRecommendation(null);
      setRecommendationError(null);
    }
  }, [dispatchModalOpen]);

  // Early returns AFTER all hooks
  if (!incidents || !activeAlert) return null;

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
        <DialogContent className="sm:max-w-md">
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

              {/* AI Recommendation Box */}
              <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <IconBrain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-sm text-blue-700 dark:text-blue-300">AI Recommendation</span>
                </div>

                {recommendationLoading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 py-2">
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    Analyzing incident and available resources...
                  </div>
                )}

                {recommendationError && (
                  <p className="text-sm text-red-500">{recommendationError}</p>
                )}

                {recommendation && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-blue-800 dark:text-blue-200">Personnel:</span>
                      <ul className="ml-4 list-disc text-blue-700 dark:text-blue-300">
                        {recommendation.recommended_personnel.map((name, i) => (
                          <li key={i}>{name}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800 dark:text-blue-200">Equipment:</span>
                      <ul className="ml-4 list-disc text-blue-700 dark:text-blue-300">
                        {recommendation.recommended_equipment.map((name, i) => (
                          <li key={i}>{name}</li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                      {recommendation.rationale}
                    </p>
                  </div>
                )}
              </div>

              <Field>
                <Label htmlFor="personnelId">Deploy Personnel</Label>
                <Select value={selectedPersonnel} onValueChange={setSelectedPersonnel}>
                  <SelectTrigger id="personnelId">
                    <SelectValue placeholder="Select Available Rescuer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePersonnel.map((p: any) => (
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
                    {availableEquipment.map((eq: any) => (
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