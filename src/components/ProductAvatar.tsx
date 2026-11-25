import React, { useEffect, useState } from "react";
import { Package } from "lucide-react";

interface ProductAvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<ProductAvatarProps["size"]>, string> = {
  sm: "h-9 w-9 rounded-lg",
  md: "h-11 w-11 rounded-lg",
  lg: "h-16 w-16 rounded-xl",
  xl: "h-20 w-20 rounded-xl",
};

export const ProductAvatar: React.FC<ProductAvatarProps> = ({
  src,
  name,
  size = "md",
  className = "",
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        aria-label={name}
        className={`flex shrink-0 items-center justify-center border border-[#ECE6D8] bg-[#F4F0E6] text-[#6B6785] dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#A09CB5] ${SIZE_CLASSES[size]} ${className}`}
      >
        <Package className="h-4 w-4" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`shrink-0 border border-[#ECE6D8] object-cover bg-[#F4F0E6] dark:border-[#2A2A44] dark:bg-[#1A1A2E] ${SIZE_CLASSES[size]} ${className}`}
    />
  );
};
