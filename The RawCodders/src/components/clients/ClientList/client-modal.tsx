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
import { TClient } from "./columns"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import { format } from "date-fns"
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function ClientModal({clientData}: {clientData?: TClient}) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);

  const createClient = useMutation(api.clients.insertClient);
  const updateClient = useMutation(api.clients.updateClient);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Extracting nested address object
    const addressData = {
      line1: (formData.get("address-l1") as string) || "",
      line2: (formData.get("address-l2") as string) || "",
      postCode: (formData.get("address-pc") as string) || "",
      city: (formData.get("address-ct") as string) || "",
      country: (formData.get("country") as string) || "",
    };

    const commonData = {
      name: formData.get("name") as string,
      email: formData.get("username") as string,
      phone: formData.get("phone") as string,
      birthDate: date?.toISOString() ?? new Date().toISOString(),
      address: addressData,
    };

    try {
      if (clientData?._id) {
        await updateClient({
          clientId: clientData._id,
          ...commonData,
          sex: (formData.get("sex") as string) || undefined, 
        });
      } else {
        await createClient({
          ...commonData,
          sex: (formData.get("sex") as string) ?? "other", 
        });
      }
      setOpen(false); // Close the modal on success
    } catch (error) {
      console.error("Submission failed:", error);
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form>
        <DialogTrigger asChild>
          <Button>
            <IconPlus className="text-white"/>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{clientData ? "Edit" : "Add"} client</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="name-1">Name</Label>
                <Input id="name-1" name="name" defaultValue={clientData?.name} />
              </Field>
              <Field>
                <Label htmlFor="email-1">E-mail</Label>
                <Input id="email-1" name="username" defaultValue={clientData?.email}/>
              </Field>
              {!clientData && <Field>
                <Label htmlFor="gender-1">Gender</Label>
                <RadioGroup id="gender-1" defaultValue="male" className="w-fit">
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
                <Input id="phone-1" name="phone" />
              </Field>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-empty={!date}
                    className="data-[empty=true]:text-muted-foreground w-[212px] justify-between text-left font-normal"
                  >
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    defaultMonth={date}
                  />
                </PopoverContent>
              </Popover>
              
              <Field>
                <Label htmlFor="address-1">Address</Label>
                <Input id="addr-1" placeholder="Address line 1" name="address-l1" />
                <Input id="addr-2" placeholder="Address line 2 (Optional)" name="address-l2" />
                <div className="flex flex-row gap-2">
                  <Input className="w-2/5" placeholder="Postcode" name="address-pc"/>
                  <Input placeholder="City" name="address-ct"/>
                </div>
                <Input placeholder="Country"/>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </form>
    </Dialog>
  )
}
