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

export function ClientModal({clientData}: {clientData?: TClient}) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button>
            <IconPlus className="text-white"/>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
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
              <PopoverTrigger>
                <Field>
                  <Label htmlFor="phone-1">Birthdate</Label>
                  <Input disabled id="phone-1" value={date?.toISOString()} name="phone" />
                </Field>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-lg border"
                  captionLayout="dropdown"
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
        </DialogContent>
      </form>
    </Dialog>
  )
}
