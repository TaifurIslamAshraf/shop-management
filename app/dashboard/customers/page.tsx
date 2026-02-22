import { getCustomers } from "@/actions/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomerForm from "@/components/customers/CustomerForm";
import CustomersClient from "./CustomersClient";

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
                    <CustomersClient customers={customers || []} />
                </CardContent>
            </Card>
        </div>
    );
}
