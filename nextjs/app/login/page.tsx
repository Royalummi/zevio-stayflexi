"use client";

/**
 * /login page
 *
 * Destination for "Login to Your Account" links in admin-created-user welcome
 * emails. Auto-opens the login modal so the user can sign in (or set their
 * permanent password when arriving with a temporary one).
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModals } from "@/contexts/AuthModalContext";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { openLoginModal } = useAuthModals();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      // Already logged in — send straight to the dashboard
      router.replace("/dashboard");
      return;
    }

    // Open the login modal; the modal itself handles the
    // force-change-password step for admin-invited users.
    openLoginModal();
  }, [isLoading, isAuthenticated, openLoginModal, router]);

  // Minimal background while the modal is opening
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* The actual login UI is rendered by the modal (from AuthModalContext) */}
    </div>
  );
}
