"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ArrowUpDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function StockHistoryFilters({ initialMovements }: { initialMovements: any[] }) {
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

    const filteredAndSortedMovements = useMemo(() => {
        let result = [...initialMovements];

        // Filter by type
        if (typeFilter !== "ALL") {
            result = result.filter((m) => m.type === typeFilter);
        }

        // Filter by date range
        if (dateRange?.from) {
            result = result.filter((m) => new Date(m.createdAt) >= dateRange.from!);
        }
        if (dateRange?.to) {
            // Need to include the whole day of 'to' date
            const toDate = new Date(dateRange.to);
            toDate.setHours(23, 59, 59, 999);
            result = result.filter((m) => new Date(m.createdAt) <= toDate);
        }

        // Sort
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [initialMovements, typeFilter, dateRange, sortOrder]);

    const getBadgeVariant = (type: string) => {
        switch (type) {
            case "IN":
                return "default"; // Assuming default is something observable like black/primary, we'll force color if needed 
            case "OUT":
                return "destructive";
            case "ADJUST":
                return "secondary"; // Often gray, but we can override with yellow/warning class
            default:
                return "outline";
        }
    };

    const getBadgeClass = (type: string) => {
        switch (type) {
            case "IN":
                return "bg-green-500 hover:bg-green-600";
            case "OUT":
                return "bg-red-500 hover:bg-red-600";
            case "ADJUST":
                return "bg-yellow-500 hover:bg-yellow-600 text-white";
            default:
                return "";
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-[200px]">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            <SelectItem value="IN">Stock In</SelectItem>
                            <SelectItem value="OUT">Stock Out</SelectItem>
                            <SelectItem value="ADJUST">Adjustment</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full sm:w-auto">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full sm:w-[300px] justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <Button
                    variant="outline"
                    className="w-full sm:w-auto ml-auto"
                    onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                >
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sort {sortOrder === "desc" ? "Newest" : "Oldest"}
                </Button>

                {(typeFilter !== "ALL" || dateRange) && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setTypeFilter("ALL");
                            setDateRange(undefined);
                        }}
                    >
                        Reset
                    </Button>
                )}
            </div>

            {/* Data Table */}
            <div className="rounded-md border mt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Change</TableHead>
                            <TableHead className="text-right">Previous</TableHead>
                            <TableHead className="text-right">New Stock</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Reference</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedMovements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                    No stock history found matching the filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedMovements.map((movement) => (
                                <TableRow key={movement._id}>
                                    <TableCell className="whitespace-nowrap">
                                        {format(new Date(movement.createdAt), "MMM dd, yyyy HH:mm")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={getBadgeClass(movement.type)}
                                            variant={getBadgeVariant(movement.type)}
                                        >
                                            {movement.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right whitespace-nowrap">
                                        <span className={movement.type === "IN" ? "text-green-600 font-medium" : movement.type === "OUT" ? "text-red-600 font-medium" : ""}>
                                            {movement.type === "IN" ? "+" : movement.type === "OUT" ? "-" : ""}{movement.quantity}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {movement.previousStock}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {movement.newStock}
                                    </TableCell>
                                    <TableCell className="max-w-[150px] truncate" title={movement.reason}>
                                        {movement.reason || "-"}
                                    </TableCell>
                                    <TableCell className="max-w-[100px] truncate text-muted-foreground" title={movement.reference}>
                                        {movement.reference || "-"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
