"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalPortalProps {
  children: React.ReactNode;
  isOpen: boolean;
}

/**
 * ModalPortal component renders its children at the document body level
 * This ensures modals overlay the entire viewport and aren't restricted by parent containers
 */
export default function ModalPortal({ children, isOpen }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Prevent body scroll when modal is open
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  // Render children at document.body level using React Portal
  return createPortal(children, document.body);
}
