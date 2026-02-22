import { ReactElement } from "react";
import TopBar from "./components/TopBar";

export default function LandingLayout({children}: {children?: ReactElement}) {
    return (
        <>
            <TopBar/>
            {children}
        </>


    )
}