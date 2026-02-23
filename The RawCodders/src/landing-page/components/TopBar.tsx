import { IconArrowNarrowRight } from "@tabler/icons-react";
import TopBarMenu from "./TopBarMenu";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function TopBar() {
    return(
        <div className="flex flex-col bg-white">
            <div className="flex sticky top-0 flex-row h-15  text-cyan-500 justify-between items-center">
                <div className="flex flex-row gap-4 md:gap-10 lg:gap-20 justify-center items-center">
                    <Link to="/">
                        <div className="ml-5 md:text-2xl text-nowrap font-bold cursor-pointer select-none">
                            The Rawcodders App
                        </div>
                    </Link>
                    <div className="hidden md:flex">
                        <TopBarMenu />
                    </div>
                </div>
                <div className="mr-5">
                    <Link to="/dashboard/main">
                        <Button className="!bg-cyan-500 hover:!bg-violet-600 rounded-none hover:cursor-pointer">
                            Go to dashboard
                            <IconArrowNarrowRight/>
                        </Button>
                    </Link>
                </div>
            </div>
            <div className="flex md:hidden justify-center mb-3">
                <TopBarMenu />
            </div>
        </div>

    )



}