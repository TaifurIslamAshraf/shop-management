"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrintButton() {
    return (
        <Button className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print Receipt
        </Button>
    );
}
