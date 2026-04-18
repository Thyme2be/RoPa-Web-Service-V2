import { RopaProvider } from "../../context/RopaContext";

export default function DataProcessorLayout({ children }: { children: React.ReactNode }) {
    return (
        <RopaProvider>
            {children}
        </RopaProvider>
    );
}
