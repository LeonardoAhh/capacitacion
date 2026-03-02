import ProfileDropdown from "@/components/profile-dropdown";
import { BancoPreguntas } from "./evaluaciones-dashboard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EvaluacionesPage() {
    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/dashboard">
                        <ArrowLeft />
                        <span className="sr-only">Volver al Dashboard</span>
                    </Link>
                </Button>
                <ProfileDropdown />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <BancoPreguntas />
            </main>
        </div>
    );
}
