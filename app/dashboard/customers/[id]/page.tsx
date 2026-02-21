import { getCustomerById, getCustomerInvoices, getCustomerPayments } from "@/actions/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ArrowLeft, DollarSign, FileText, Clock, User } from "lucide-react";
import { format } from "date-fns";
import CustomerForm from "@/components/customers/CustomerForm";
import CustomerInvoices from "@/components/customers/CustomerInvoices";
import PaymentHistory from "@/components/customers/PaymentHistory";
import CollectPaymentDialog from "@/components/customers/CollectPaymentDialog";

interface CustomerDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
    const { id } = await params;

    const [customerResult, invoicesResult, paymentsResult] = await Promise.all([
        getCustomerById(id),
        getCustomerInvoices(id),
        getCustomerPayments(id),
    ]);

    if (!customerResult.success || !customerResult.customer) {
        return (
            <div className="p-8 text-red-500">
                <h2>Customer not found</h2>
                <p>{customerResult.error}</p>
            </div>
        );
    }

    const customer = customerResult.customer;
    const invoices = invoicesResult.invoices || [];
    const payments = paymentsResult.payments || [];

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/customers">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{customer.name}</h2>
                        <p className="text-muted-foreground">
                            {customer.phone || customer.email || "No contact info"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <CustomerForm customer={customer} />
                    {customer.totalDue > 0 && (
                        <CollectPaymentDialog
                            customerId={customer._id}
                            customerName={customer.name}
                            totalDue={customer.totalDue}
                            trigger={
                                <Button>
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Collect Payment
                                </Button>
                            }
                        />
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Due</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${customer.totalDue > 0 ? "text-red-600" : ""}`}>
                            ${customer.totalDue.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ${customer.totalPaid.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Invoices</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customer.invoiceCount}</div>
                        {customer.unpaidInvoiceCount > 0 && (
                            <p className="text-xs text-red-500 mt-1">
                                {customer.unpaidInvoiceCount} unpaid
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Oldest Due</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            {customerResult.oldestUnpaidDate
                                ? format(new Date(customerResult.oldestUnpaidDate), "PP")
                                : "—"}
                        </div>
                        {customerResult.latestSale && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Last sale: {format(new Date(customerResult.latestSale.createdAt), "PP")}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="invoices" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="invoices">
                        Invoices ({invoices.length})
                    </TabsTrigger>
                    <TabsTrigger value="payments">
                        Payments ({payments.length})
                    </TabsTrigger>
                    <TabsTrigger value="details">
                        Details
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="invoices">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Invoices</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CustomerInvoices
                                invoices={invoices}
                                customerId={customer._id}
                                customerName={customer.name}
                                totalDue={customer.totalDue}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PaymentHistory payments={payments} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="details">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                                    <dd className="text-sm font-semibold mt-1">{customer.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                                    <dd className="text-sm font-semibold mt-1">{customer.phone || "—"}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                                    <dd className="text-sm font-semibold mt-1">{customer.email || "—"}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                                    <dd className="text-sm font-semibold mt-1">{customer.address || "—"}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                                    <dd className="mt-1">
                                        <Badge variant={customer.status === "Active" ? "secondary" : "outline"}>
                                            {customer.status}
                                        </Badge>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Customer Since</dt>
                                    <dd className="text-sm font-semibold mt-1">
                                        {format(new Date(customer.createdAt), "PPP")}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
