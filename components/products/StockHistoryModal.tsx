"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { getStockMovements } from "@/actions/stock";
import { type Product } from "@/app/dashboard/products/columns";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StockHistoryModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

export function StockHistoryModal({ product, isOpen, onClose }: StockHistoryModalProps) {
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchMovements = async () => {
            if (!product) return;
            setLoading(true);
            try {
                const res = await getStockMovements(product._id);
                if (res.success) {
                    setMovements(res.movements || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && product) {
            fetchMovements();
        } else {
            setMovements([]);
        }
    }, [isOpen, product]);

    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Stock History: {product.name}</DialogTitle>
                    <DialogDescription>
                        Audit trail for stock adjustments
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading history...</div>
                    ) : movements.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No stock history available.</div>
                    ) : (
                        <ScrollArea className="h-[400px] w-full rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Previous</TableHead>
                                        <TableHead className="text-right">New</TableHead>
                                        <TableHead>Reason</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movements.map((movement) => (
                                        <TableRow key={movement._id}>
                                            <TableCell className="whitespace-nowrap">
                                                {format(new Date(movement.createdAt), "MMM d, yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={movement.type === "ADD" ? "default" : movement.type === "REMOVE" ? "destructive" : "secondary"}
                                                >
                                                    {movement.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{movement.quantity}</TableCell>
                                            <TableCell className="text-right">{movement.previousStock}</TableCell>
                                            <TableCell className="text-right font-medium">{movement.newStock}</TableCell>
                                            <TableCell className="max-w-[150px] truncate" title={movement.reason}>
                                                {movement.reason || "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
