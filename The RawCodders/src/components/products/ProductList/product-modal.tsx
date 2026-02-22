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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconPlus } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react"
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useProductsContext } from "./products-context";

export function ProductModal() {
  const { selectedProduct, setSelectedProduct, editProductModalState, setEditProductModalState } = useProductsContext();
  const clearSelectedTimeoutRef = useRef<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");

  const normalizeImageUrl = (url: string) => {
    if(url.slice(0,8) === "https://")
    {
      return url.slice(8);
    }
    else if(url.slice(0,7) === "http://")
    {
      return url.slice(7);
    }
    return url;
  };

  const createProduct = useMutation(api.products.insertProduct);
  const updateProduct = useMutation(api.products.updateProductStock);

  function scheduleClearSelectedProduct() {
    if (clearSelectedTimeoutRef.current !== null) {
      window.clearTimeout(clearSelectedTimeoutRef.current);
    }
    // Delay to allow the close animation to finish.
    clearSelectedTimeoutRef.current = window.setTimeout(() => {
      setSelectedProduct(undefined);
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

    const commonData = {
      name: formData.get("name") as string,
      image: formData.get("imageUrl") as string,
      stock: Number(formData.get("stock")),
      price: Number(formData.get("price"))
    };

    try {
      if (selectedProduct?._id) {
        await updateProduct({
          productId: selectedProduct._id,
          amountChange: Number(formData.get("stock"))
        });
      } else {
        await createProduct({
          product: commonData,
        });
      }
      setEditProductModalState(false); // Close the modal on success
      scheduleClearSelectedProduct();
    } catch (error) {
      console.error("Submission failed:", error);
    }
  }
  
  return (
    <Dialog
      open={editProductModalState}
      onOpenChange={(open) => {
        setEditProductModalState(open);
        if (!open) {
          scheduleClearSelectedProduct();
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
              <DialogTitle>{selectedProduct ? "Edit" : "Add"} client</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="name-1">Name</Label>
                <Input id="name-1" disabled={!!selectedProduct} name="name" defaultValue={selectedProduct?.name} />
              </Field>
              {!selectedProduct && <Field>
                <Label htmlFor="email-1">Image URL</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText >https://</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput placeholder="cdn.imagehost.com/static/image.png" name="imageUrl" className="!pl-0.5" value={imageUrl} onChange={(e) => setImageUrl(normalizeImageUrl(e.target.value))} />
                </InputGroup>
              </Field>}
              <Field>
                <Label htmlFor="phone-1">Stock</Label>
                <InputGroup>
                  <InputGroupAddon>
                      {!!selectedProduct && <InputGroupText>+</InputGroupText>}
                  </InputGroupAddon>
                  <InputGroupInput id="phone-1" type="number" name="stock" defaultValue={0} />
                </InputGroup>
              </Field>
              {!selectedProduct && <Field>
                <Label htmlFor="phone-1">Price</Label>
                  <Input id="phone-1" type="number" name="price" defaultValue={50} />
              </Field>}
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
