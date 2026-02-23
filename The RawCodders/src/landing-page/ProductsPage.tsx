
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"


function ProductCard() {
    return (
        <Card className="bg-linear-65 from-orange-300 to-teal-300 gap-1">
                <CardContent>
                        <img
                            className="w-[200px] aspect-[4/3] object-cover"
                            src={"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkfGjlKOBsjhl6ZU258G6KxdbtL4o7te0awQ&s"}
                            alt="Product"
                        />
                </CardContent>
                <CardFooter className="text-fuchsia-700">
                    <h2>Text</h2>
                </CardFooter>
            </Card>
    )

}


export default function ProductsPage() {
    return(
        <div>
            <ProductCard />
        </div>

    )
}