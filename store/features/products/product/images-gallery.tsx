"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import { Product } from "../types";

interface ImagesGalleryProps {
  product: Product;
}

export const ImagesGallery: React.FC<ImagesGalleryProps> = ({ product }) => {
  const [pos, setPos] = useState(0);

  return (
    <div className="space-y-6">
      <div className="w-full rounded-md bg-gray-200/50">
        <Image
          src={`${process.env.NEXT_PUBLIC_API_URL}/files/${product.images[pos].id}`}
          alt="Cover image"
          width={640}
          height={640}
          className="aspect-square h-full w-full object-contain"
        />
      </div>
      <div className="grid h-fit w-full grid-cols-4 gap-6">
        {product.images.map((image, i) => (
          <div
            onClick={() => setPos(i)}
            className={cn(
              "cursor-pointer",
              pos === i && "h-fit rounded ring-2 ring-blue-500 ring-offset-2"
            )}
          >
            <Image
              width={200}
              height={200}
              key={image.id}
              className={cn(
                "aspect-square cursor-pointer rounded object-cover",
                pos !== i && "opacity-50"
              )}
              src={`${process.env.NEXT_PUBLIC_API_URL}/files/${image.id}`}
              alt={product.name}
            />
          </div>
        ))}
      </div>
    </div>
  );
};