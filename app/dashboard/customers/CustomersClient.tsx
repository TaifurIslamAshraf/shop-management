"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { deleteCustomer } from "@/actions/customer";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CustomersClientProps {
    customers: any[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
    };
}

export default function CustomersClient({ customers, pagination }: CustomersClientProps) {
    const router = useRouter();

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete customer "${name}"?`)) {
            const result = await deleteCustomer(id);
            if (result.success) {
                toast.success("Customer deleted successfully");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete customer");
            }
        }
    };

    if (!customers || customers.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No customers found. Click &quot;Add Customer&quot; to create one.
            </div>
        );
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-right">Total Due</TableHead>
                        <TableHead className="text-center">Unpaid Invoices</TableHead>
                        <TableHead className="text-center">Total Invoices</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customers.map((customer: any) => (
                        <TableRow key={customer._id}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.phone || "—"}</TableCell>
                            <TableCell className="text-right">
                                {customer.totalDue > 0 ? (
                                    <span className="font-bold text-red-600">
                                        ${customer.totalDue.toFixed(2)}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">$0.00</span>
                                )}
                            </TableCell>
                            <TableCell className="text-center">
                                {customer.unpaidInvoiceCount > 0 ? (
                                    <Badge variant="destructive">
                                        {customer.unpaidInvoiceCount}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground">0</span>
                                )}
                            </TableCell>
                            <TableCell className="text-center">
                                {customer.invoiceCount}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        customer.status === "Active"
                                            ? "secondary"
                                            : "outline"
                                    }
                                >
                                    {customer.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <Link href={`/dashboard/customers/${customer._id}`}>
                                        <Button variant="ghost" size="icon">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(customer._id, customer.name)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
            />
        </>
    );
}
