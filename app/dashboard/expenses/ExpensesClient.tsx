"use client";

import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface ExpensesClientProps {
    expenses: any[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
    };
}

export default function ExpensesClient({ expenses, pagination }: ExpensesClientProps) {
    return (
        <div>
            <DataTable
                columns={columns}
                data={expenses}
                searchKey="title"
            />
            <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
            />
        </div>
    );
}
