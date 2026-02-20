"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { createExpense, updateExpense } from "@/actions/expense";

const formSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    category: z.string().min(1, "Category is required"),
    expenseDate: z.date({
        message: "A date of expense is required.",
    }),
    description: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
    initialData?: any | null;
}

const CATEGORIES = [
    "Rent",
    "Utilities",
    "Salary",
    "Marketing",
    "Supplies",
    "Software",
    "Maintenance",
    "Other",
];

export function ExpenseForm({ initialData }: ExpenseFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const title = initialData ? "Edit Expense" : "Create Expense";
    const description = initialData ? "Edit a business expense." : "Add a new business expense.";
    const toastMessage = initialData ? "Expense updated." : "Expense created.";
    const action = initialData ? "Save changes" : "Create";

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialData
            ? {
                ...initialData,
                amount: parseFloat(initialData.amount),
                expenseDate: initialData.expenseDate ? new Date(initialData.expenseDate) : new Date(),
            }
            : {
                title: "",
                amount: 0,
                category: "",
                expenseDate: new Date(),
                description: "",
            },
    });

    const onSubmit = async (data: ExpenseFormValues) => {
        try {
            setIsLoading(true);
            let result;

            if (initialData) {
                result = await updateExpense(initialData._id, data);
            } else {
                result = await createExpense(data);
            }

            if (result.success) {
                toast.success(toastMessage);
                router.push(`/dashboard/expenses`);
                router.refresh();
            } else {
                toast.error(result.error || "Something went wrong.");
            }
        } catch (error: any) {
            toast.error("Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                    <p className="text-muted-foreground">{description}</p>
                </div>
            </div>
            <div className="mx-auto max-w-2xl mt-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
                        <div className="grid md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input disabled={isLoading} placeholder="Office Rent" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" disabled={isLoading} placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select
                                            disabled={isLoading}
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {CATEGORIES.map((cat) => (
                                                    <SelectItem key={cat} value={cat}>
                                                        {cat}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="expenseDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col mt-2.5">
                                        <FormLabel>Date of Expense</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                        disabled={isLoading}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date > new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            disabled={isLoading}
                                            placeholder="Additional details about the expense"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button disabled={isLoading} className="ml-auto" type="submit">
                            {action}
                        </Button>
                    </form>
                </Form>
            </div>
        </>
    );
}
