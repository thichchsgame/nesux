"use client";

import { useEffect } from "react";
import { recordProductViewAction } from "@/app/(storefront)/products/recently-viewed-actions";

export function RecordView({ productId }: { productId: string }) {
  useEffect(() => {
    recordProductViewAction(productId).catch(() => undefined);
  }, [productId]);

  return null;
}
