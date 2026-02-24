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
import { IconPlus } from "@tabler/icons-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useEffect, useRef, useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import { format } from "date-fns"
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useClientsContext } from "./clients-context";

export function ClientModal() {
  const { selectedClient, setSelectedClient, editClientModalState, setEditClientModalState, setModalObserver } = useClientsContext();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const clearSelectedTimeoutRef = useRef<number | null>(null);
  const [gender, setGender] = useState<"male" | "female" | "other">("male");

  const createClient = useMutation(api.clients.insertClient);
  const updateClient = useMutation(api.clients.updateClient);

  function scheduleClearSelectedClient() {
    setGender("male");
    if (clearSelectedTimeoutRef.current !== null) {
      window.clearTimeout(clearSelectedTimeoutRef.current);
    }
    // Delay to allow the close animation to finish.
    clearSelectedTimeoutRef.current = window.setTimeout(() => {
      setSelectedClient(undefined);
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

    // Extracting nested address object
    const addressData = {
      line1: (formData.get("address-l1") as string) || "",
      line2: (formData.get("address-l2") as string) || "",
      postCode: (formData.get("address-pc") as string) || "",
      city: (formData.get("address-ct") as string) || "",
      country: (formData.get("address-ctry") as string) || "",
    };

    const commonData = {
      name: formData.get("name") as string,
      email: formData.get("username") as string,
      phone: formData.get("phone") as string,
      birthDate: date?.toISOString() ?? new Date().toISOString(),
      address: addressData,
    };

    try {
      if (selectedClient?._id) {
        await updateClient({
          clientId: selectedClient._id,
          ...commonData,
          sex: (formData.get("sex") as string) || undefined, 
        });
      } else {
        await createClient({
          ...commonData,
          sex: gender ?? "other", 
        });
      }
      setEditClientModalState(false); // Close the modal on success
      setModalObserver((prev) => prev + 1);
      scheduleClearSelectedClient();
    } catch (error) {
      console.error("Submission failed:", error);
    }
  }
  
  return (
    <Dialog
      open={editClientModalState}
      onOpenChange={(open) => {
        setEditClientModalState(open);
        if (!open) {
          scheduleClearSelectedClient();
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
              <DialogTitle>{selectedClient ? "Edit" : "Add"} client</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="name-1">Name</Label>
                <Input id="name-1" name="name" defaultValue={selectedClient?.name} />
              </Field>
              <Field>
                <Label htmlFor="email-1">E-mail</Label>
                <Input id="email-1" name="username" defaultValue={selectedClient?.email}/>
              </Field>
              {!selectedClient && <Field>
                <Label htmlFor="gender-1">Gender</Label>
                <RadioGroup id="gender-1" defaultValue="male" value={gender} onValueChange={(v) => setGender(v as "male" | "female" | "other")} className="w-fit">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="male" id="r1" />
                    <Label htmlFor="r1">Male</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="female" id="r2" />
                    <Label htmlFor="r2">Female</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="other" id="r3" />
                    <Label htmlFor="r3">Other</Label>
                  </div>
                </RadioGroup>
              </Field>}
              <Field>
                <Label htmlFor="phone-1">Phone</Label>
                <Input id="phone-1" name="phone" defaultValue={selectedClient?.phone} />
              </Field>

              {!selectedClient && <Popover>
                <PopoverTrigger asChild>
                  <Field>
                    <Label htmlFor="birthd-1">Birthdate</Label>
                    <Button
                      id="birthd-1"
                      type="button"
                      variant="outline"
                      data-empty={!date}
                      className="data-[empty=true]:text-muted-foreground w-[212px] justify-between text-left font-normal"
                    >
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                      <ChevronDownIcon />
                    </Button>
                  </Field>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    defaultMonth={date}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover> }
              
              <Field>
                <Label htmlFor="address-1">Address</Label>
                <Input id="addr-1" placeholder="Address line 1" name="address-l1" defaultValue={selectedClient?.address.line1} />
                <Input id="addr-2" placeholder="Address line 2 (Optional)" name="address-l2" defaultValue={selectedClient?.address.line2} />
                <div className="flex flex-row gap-2">
                  <Input className="w-2/5" placeholder="Postcode" name="address-pc" defaultValue={selectedClient?.address.postCode}/>
                  <Input placeholder="City" name="address-ct" defaultValue={selectedClient?.address.city}/>
                </div>
                <Input placeholder="Country" name="address-ctry" defaultValue={selectedClient?.address.country}/>
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
    </Dialog>
  )
}
