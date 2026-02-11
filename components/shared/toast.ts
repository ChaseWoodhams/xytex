"use client";

import { toast } from "sonner";

type ToastVariant = "success" | "error" | "info";

export function showToast(message: string, variant: ToastVariant = "info") {
  if (variant === "success") {
    toast.success(message);
  } else if (variant === "error") {
    toast.error(message);
  } else {
    toast(message);
  }
}

