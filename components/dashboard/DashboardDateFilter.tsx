"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { subMonths, subYears } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function DashboardDateFilter() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Default to "current-day"
    const [filterValue, setFilterValue] = useState<string>(() => {
        return searchParams.get("filter") || "current-day";
    });

    const handleSelect = (value: string) => {
        setFilterValue(value);
        const params = new URLSearchParams(searchParams);

        if (value === "current-day") {
            params.delete("filter");
            params.delete("from");
            params.delete("to");
        } else {
            let fromDate = new Date();
            const toDate = new Date();

            switch (value) {
                case "1-month":
                    fromDate = subMonths(new Date(), 1);
                    break;
                case "6-month":
                    fromDate = subMonths(new Date(), 6);
                    break;
                case "1-year":
                    fromDate = subYears(new Date(), 1);
                    break;
            }

            params.set("filter", value);
            params.set("from", fromDate.toISOString());
            params.set("to", toDate.toISOString());
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    const clearFilter = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setFilterValue("current-day");
        const params = new URLSearchParams(searchParams);
        params.delete("filter");
        params.delete("from");
        params.delete("to");
        router.push(`${pathname}?${params.toString()}`);
    };

    const hasCustomFilter = searchParams.has("filter");

    return (
        <div className="grid gap-2">
            <div className="flex items-center gap-2">
                <Select value={filterValue} onValueChange={handleSelect}>
                    <SelectTrigger id="date" className="w-[180px]">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            <SelectValue placeholder="Select period" />
                        </div>
                    </SelectTrigger>
                    <SelectContent align="end">
                        <SelectItem value="current-day">Current Day</SelectItem>
                        <SelectItem value="1-month">1 Month</SelectItem>
                        <SelectItem value="6-month">6 Months</SelectItem>
                        <SelectItem value="1-year">1 Year</SelectItem>
                    </SelectContent>
                </Select>

                {hasCustomFilter && filterValue !== "current-day" && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearFilter}
                        className="h-9 w-9"
                        title="Clear filter"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
