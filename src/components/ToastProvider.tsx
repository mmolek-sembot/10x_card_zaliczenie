import React from "react";
import { Toaster } from "@/components/ui/sonner";

export const ToastProvider: React.FC = () => {
  return (
    <Toaster 
      position="top-right"
      richColors
      closeButton
    />
  );
}; 