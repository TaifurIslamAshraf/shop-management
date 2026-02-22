import { getOrderById } from "@/actions/order";
import { format } from "date-fns";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PrintButton from "@/components/pos/PrintButton";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const { order, success, error } = await getOrderById(resolvedParams.id);

    if (!success || !order) {
        return (
            <div className="p-8 text-center text-red-500">
                <h2>Error loading receipt</h2>
                <p>{error || "Order not found"}</p>
                <Link href="/dashboard/pos">
                    <Button className="mt-4">Return to POS</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 pt-6 max-w-2xl mx-auto">
            {/* Non-printable header */}
            <div className="flex justify-between items-center mb-8 print:hidden">
                <Link href="/dashboard/pos">
                    <Button variant="outline" className="gap-2">
                        <MoveLeft className="h-4 w-4" />
                        Back to POS
                    </Button>
                </Link>
                <div className="flex gap-2">
                    <Link href="/dashboard/orders">
                        <Button variant="secondary">View All Orders</Button>
                    </Link>
                    {/* The print dialog is a client-side action, so we can use a simple script or just tell the user to press Ctrl+P for now. Better yet, we can add a small client component for the print button, or just use onClick if it was a client component. Let's make the button hide in print. */}
                    <PrintButton />
                </div>
            </div>

            {/* Printable Receipt */}
            <div className="bg-white p-8 rounded-lg shadow-sm border print:shadow-none print:border-none print:p-0 text-black">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold uppercase mb-1">ShopDash POS</h1>
                    <p className="text-sm text-gray-500">123 Business Road, Commerce City</p>
                    <p className="text-sm text-gray-500">Phone: 555-0192 | Web: shopdash.com</p>
                </div>

                <div className="flex justify-between border-b pb-4 mb-4 text-sm">
                    <div>
                        <p className="text-gray-500">Order No:</p>
                        <p className="font-semibold">{order.orderNumber}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500">Date:</p>
                        <p className="font-semibold">{format(new Date(order.createdAt), "PPP p")}</p>
                    </div>
                </div>

                {(order.customerName || order.customerPhone) && (
                    <div className="border-b pb-4 mb-4 text-sm">
                        <p className="text-gray-500 mb-1">Customer Details:</p>
                        {order.customerName && <p className="font-medium">{order.customerName}</p>}
                        {order.customerPhone && <p className="text-gray-600">{order.customerPhone}</p>}
                    </div>
                )}

                <div className="mb-6">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2">Item</th>
                                <th className="text-center py-2">Qty</th>
                                <th className="text-right py-2">Price</th>
                                <th className="text-right py-2">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item: any, index: number) => (
                                <tr key={index} className="border-b border-gray-100 border-dashed">
                                    <td className="py-2 pr-2">
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-gray-400">{item.sku}</div>
                                        {item.description && (
                                            <div className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate" title={item.description}>
                                                &quot;{item.description}&quot;
                                            </div>
                                        )}
                                    </td>
                                    <td className="text-center py-2">{item.quantity}</td>
                                    <td className="text-right py-2">${item.price.toFixed(2)}</td>
                                    <td className="text-right py-2 font-medium">${item.subTotal.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-2 text-sm ml-auto w-1/2">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>${order.subTotal.toFixed(2)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Discount:</span>
                            <span>-${order.discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    {order.taxAmount > 0 && (
                        <div className="flex justify-between text-gray-600">
                            <span>Tax:</span>
                            <span>+${order.taxAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                        <span>Total:</span>
                        <span>${order.totalAmount.toFixed(2)}</span>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t text-sm text-center">
                    <p className="mb-1">Payment Method: <span className="font-semibold">{order.paymentMethod}</span></p>
                    <p className="text-gray-500 italic mt-6">Thank you for your business!</p>
                </div>
            </div>
        </div>
    );
}
