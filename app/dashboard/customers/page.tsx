import { getCustomers } from "@/actions/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Eye } from "lucide-react";
import CustomerForm from "@/components/customers/CustomerForm";

export default async function CustomersPage() {
    const { customers, success, error } = await getCustomers();

    if (!success) {
        return (
            <div className="p-8 text-red-500">
                <h2>Failed to load Customers</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
                    <p className="text-muted-foreground">
                        Manage customers and their credit accounts.
                    </p>
                </div>
                <CustomerForm />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Customers</CardTitle>
                </CardHeader>
                <CardContent>
                    {!customers || customers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No customers found. Click "Add Customer" to create one.
                        </div>
                    ) : (
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
                                            <Link href={`/dashboard/customers/${customer._id}`}>
                                                <Button variant="ghost" size="icon">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
