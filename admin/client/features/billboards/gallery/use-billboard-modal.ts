import { create } from "zustand";

interface BillboardModalStore {
  isOpen: boolean;
  id: number;
  onOpen: (id: number) => void;
  onClose: () => void;
}

export const useBillboardModal = create<BillboardModalStore>((set) => ({
  isOpen: false,
  id: 0,
  onOpen: (id) => set({ isOpen: true, id }),
  onClose: () => set({ isOpen: false, id: 0 }),
}));
