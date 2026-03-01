"use client";

import React, { createContext, useContext, useState } from "react";
import LoginModal from "@/components/auth/LoginModal";
import SignupModal from "@/components/auth/SignupModal";
import EmailVerificationSentModal from "@/components/auth/EmailVerificationSentModal";

interface AuthModalContextType {
  openLoginModal: () => void;
  openSignupModal: () => void;
  closeModals: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(
  undefined,
);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [verificationInfo, setVerificationInfo] = useState<{
    email: string;
    companyName: string;
  } | null>(null);

  const openLoginModal = () => {
    setIsSignupOpen(false);
    setIsLoginOpen(true);
  };

  const openSignupModal = () => {
    setIsLoginOpen(false);
    setIsSignupOpen(true);
  };

  const closeModals = () => {
    setIsLoginOpen(false);
    setIsSignupOpen(false);
  };

  const switchToSignup = () => {
    setIsLoginOpen(false);
    setIsSignupOpen(true);
  };

  const switchToLogin = () => {
    setIsSignupOpen(false);
    setIsLoginOpen(true);
  };

  const handleCorporateRegistered = (email: string, companyName: string) => {
    // Set both states atomically so React batches them in one render
    setVerificationInfo({ email, companyName });
    setIsSignupOpen(false);
  };

  return (
    <AuthModalContext.Provider
      value={{ openLoginModal, openSignupModal, closeModals }}
    >
      {children}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={closeModals}
        onSwitchToSignup={switchToSignup}
      />
      <SignupModal
        isOpen={isSignupOpen}
        onClose={closeModals}
        onSwitchToLogin={switchToLogin}
        onCorporateRegistered={handleCorporateRegistered}
      />
      <EmailVerificationSentModal
        isOpen={verificationInfo !== null}
        onClose={() => setVerificationInfo(null)}
        email={verificationInfo?.email ?? ""}
        companyName={verificationInfo?.companyName ?? ""}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModals() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error("useAuthModals must be used within an AuthModalProvider");
  }
  return context;
}
