import { RopaProvider } from "@/context/RopaContext";

export default function DataOwnerLayout({ children }: { children: React.ReactNode }) {
    return (
        <RopaProvider>
            {children}
        </RopaProvider>
    );
}

