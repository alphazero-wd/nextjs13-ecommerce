"use client";

import { Checkbox } from "@/features/ui";
import {
  DataTableColumnHeader,
  DataTableRowActions,
  useDeleteRecordsModal,
} from "@/features/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useCategoriesStore } from "../context";
import { useEditCategoryModal } from "../edit-category";
import { Category } from "../types";

export const columns: ColumnDef<Category>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => {
      const { getCategories } = useCategoriesStore();
      return (
        <DataTableColumnHeader
          getData={getCategories}
          column={column}
          title="Category"
        />
      );
    },
    cell: ({ row }) => (
      <div className="line-clamp-1 font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    id: "desc",
    accessorKey: "desc",
    header: "Description",
    cell: ({ row }) => (
      <p className="line-clamp-1">
        {row.getValue("desc") || "No description provided"}
      </p>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { onOpen: onEditOpen } = useEditCategoryModal();
      const { onOpen: onDeleteOpen } = useDeleteRecordsModal();
      return (
        <DataTableRowActions
          row={row}
          onEditAction={onEditOpen}
          onDeleteAction={onDeleteOpen}
        />
      );
    },
  },
];
