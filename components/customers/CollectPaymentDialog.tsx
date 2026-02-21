"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { collectPaymentForInvoice, collectPaymentForCustomer } from "@/actions/payment";
import { DollarSign } from "lucide-react";

interface CollectPaymentDialogProps {
    customerId: string;
    customerName: string;
    totalDue: number;
    // If provided, pre-selects specific invoice mode
    invoice?: {
        _id: string;
        orderNumber: string;
        dueAmount: number;
    };
    trigger?: React.ReactNode;
}

export default function CollectPaymentDialog({
    customerId,
    customerName,
    totalDue,
    invoice,
    trigger,
}: CollectPaymentDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentType, setPaymentType] = useState<"specific_invoice" | "customer_total">(
        invoice ? "specific_invoice" : "customer_total"
    );
    const [amount, setAmount] = useState<number>(
        invoice ? invoice.dueAmount : totalDue
    );
    const [method, setMethod] = useState("Cash");
    const [note, setNote] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (amount <= 0) {
            toast.error("Amount must be greater than 0");
            return;
        }

        setIsSubmitting(true);
        try {
            let result;

            if (paymentType === "specific_invoice" && invoice) {
                result = await collectPaymentForInvoice({
                    saleId: invoice._id,
                    amount,
                    method: method as any,
                    note: note || undefined,
                });
            } else {
                result = await collectPaymentForCustomer({
                    customerId,
                    amount,
                    method: method as any,
                    note: note || undefined,
                });
            }

            if (result.success) {
                toast.success("Payment collected successfully!");
                setOpen(false);
                setAmount(0);
                setNote("");
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to collect payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePaymentTypeChange = (value: string) => {
        const type = value as "specific_invoice" | "customer_total";
        setPaymentType(type);
        if (type === "specific_invoice" && invoice) {
            setAmount(invoice.dueAmount);
        } else {
            setAmount(totalDue);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <DollarSign className="mr-1 h-3.5 w-3.5" />
                        Collect
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle>Collect Payment</DialogTitle>
                    <DialogDescription>
                        Collecting payment from <span className="font-semibold">{customerName}</span>
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-5 py-4">
                        {/* Payment type selection */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Payment For</Label>
                            <RadioGroup
                                value={paymentType}
                                onValueChange={handlePaymentTypeChange}
                                className="grid grid-cols-1 gap-2"
                            >
                                {invoice && (
                                    <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                                        <RadioGroupItem value="specific_invoice" id="specific" />
                                        <Label htmlFor="specific" className="flex-1 cursor-pointer">
                                            <span className="font-medium">Specific Invoice</span>
                                            <span className="block text-xs text-muted-foreground mt-0.5">
                                                {invoice.orderNumber} — Due: ${invoice.dueAmount.toFixed(2)}
                                            </span>
                                        </Label>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                                    <RadioGroupItem value="customer_total" id="total" />
                                    <Label htmlFor="total" className="flex-1 cursor-pointer">
                                        <span className="font-medium">Total Customer Due</span>
                                        <span className="block text-xs text-muted-foreground mt-0.5">
                                            Auto-distributes to oldest invoices first (FIFO)
                                            — Total Due: ${totalDue.toFixed(2)}
                                        </span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount ($)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={
                                    paymentType === "specific_invoice" && invoice
                                        ? invoice.dueAmount
                                        : totalDue
                                }
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Max: $
                                {paymentType === "specific_invoice" && invoice
                                    ? invoice.dueAmount.toFixed(2)
                                    : totalDue.toFixed(2)}
                            </p>
                        </div>

                        {/* Method */}
                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="Card">Card</SelectItem>
                                    <SelectItem value="Mobile Banking">Mobile Banking</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Note */}
                        <div className="space-y-2">
                            <Label htmlFor="note">Note (Optional)</Label>
                            <Textarea
                                id="note"
                                placeholder="Payment notes..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || amount <= 0}>
                            {isSubmitting ? "Processing..." : `Collect $${amount.toFixed(2)}`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
