"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function DashboardDateFilter() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize state from URL or defaults
    const [date, setDate] = useState<DateRange | undefined>(() => {
        const fromParam = searchParams.get("from");
        const toParam = searchParams.get("to");

        if (fromParam) {
            return {
                from: new Date(fromParam),
                to: toParam ? new Date(toParam) : undefined,
            };
        }

        // Default to last 30 days
        return {
            from: subDays(new Date(), 30),
            to: new Date(),
        };
    });

    const handleSelect = (selectedDate: DateRange | undefined) => {
        setDate(selectedDate);
        if (selectedDate?.from) {
            const params = new URLSearchParams(searchParams);
            params.set("from", selectedDate.from.toISOString());
            if (selectedDate.to) {
                params.set("to", selectedDate.to.toISOString());
            } else {
                params.delete("to");
            }
            router.push(`${pathname}?${params.toString()}`);
        } else {
            const params = new URLSearchParams(searchParams);
            params.delete("from");
            params.delete("to");
            router.push(`${pathname}?${params.toString()}`);
        }
    };

    const clearFilter = (e: React.MouseEvent) => {
        e.stopPropagation();
        const defaultDate = {
            from: subDays(new Date(), 30),
            to: new Date(),
        };
        setDate(defaultDate);
        const params = new URLSearchParams(searchParams);
        params.delete("from");
        params.delete("to");
        router.push(`${pathname}?${params.toString()}`);
    };

    const hasCustomFilter = searchParams.has("from") || searchParams.has("to");

    return (
        <div className="grid gap-2">
            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-[260px] justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={handleSelect}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
                {hasCustomFilter && (
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
