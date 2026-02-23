import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function TopBarMenu() {
    return (
        <div className="flex flex-row gap-7">
            <Link to="/products">
                <Button className="!bg-cyan-500 hover:!bg-violet-600 rounded-none hover:cursor-pointer">
                    Products
                </Button>
            </Link>
            <Link to="/about-us">
                <Button className="!bg-cyan-500 hover:!bg-violet-600 rounded-none hover:cursor-pointer">
                    About us
                </Button>
            </Link>
        </div>
    )
}