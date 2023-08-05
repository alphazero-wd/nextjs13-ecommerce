"use client";
import { Button, Label, useDeleteRecordsModal } from "@/features/ui";

export const DeleteCategoryButton = () => {
  const { onOpen } = useDeleteRecordsModal();
  return (
    <div>
      <Label>Delete category</Label>
      <p className="text-sm text-gray-500">This action cannot be undone.</p>
      <Button onClick={onOpen} variant="destructive" className="mt-3">
        Delete category
      </Button>
    </div>
  );
};
