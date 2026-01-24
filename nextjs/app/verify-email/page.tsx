"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import styles from "./verify-email.module.css";
import { FiCheckCircle, FiXCircle, FiMail, FiLoader } from "react-icons/fi";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage(
        "Invalid verification link. Please check your email and try again."
      );
      return;
    }

    verifyEmail(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await api.post("/corporate/verify-email", {
        token,
      });

      if (response.data.success) {
        setStatus("success");
        setMessage(
          "Your email has been verified successfully! You can now access all corporate features."
        );

        // Update localStorage if user is logged in
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          user.corporate_verified = true;
          localStorage.setItem("user", JSON.stringify(user));
        }

        // Redirect to corporate offers after 3 seconds
        setTimeout(() => {
          router.push("/corporate-offers");
        }, 3000);
      }
    } catch (error: unknown) {
      setStatus("error");
      const err = error as { response?: { data?: { message?: string } } };

      if (err.response?.data?.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage(
          "Failed to verify email. The link may have expired or is invalid."
        );
      }
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login to resend verification email");
        router.push("/");
        return;
      }

      const response = await api.post(
        "/corporate/resend-verification",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("Verification email sent! Please check your inbox.");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(
        err.response?.data?.message || "Failed to resend verification email"
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {status === "loading" && (
          <>
            <div className={styles.iconContainer}>
              <FiLoader className={styles.spinner} size={64} />
            </div>
            <h1 className={styles.title}>Verifying Your Email</h1>
            <p className={styles.message}>
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className={styles.iconContainer}>
              <FiCheckCircle className={styles.successIcon} size={64} />
            </div>
            <h1 className={styles.title}>Email Verified!</h1>
            <p className={styles.message}>{message}</p>
            <div className={styles.redirectMessage}>
              Redirecting you to corporate offers in 3 seconds...
            </div>
            <button
              onClick={() => router.push("/corporate-offers")}
              className={styles.primaryBtn}
            >
              Go to Corporate Offers Now
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className={styles.iconContainer}>
              <FiXCircle className={styles.errorIcon} size={64} />
            </div>
            <h1 className={styles.title}>Verification Failed</h1>
            <p className={styles.message}>{message}</p>

            <div className={styles.actions}>
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className={styles.primaryBtn}
              >
                <FiMail />
                {isResending ? "Sending..." : "Resend Verification Email"}
              </button>

              <button
                onClick={() => router.push("/")}
                className={styles.secondaryBtn}
              >
                Back to Home
              </button>
            </div>

            <div className={styles.helpSection}>
              <h3>Need Help?</h3>
              <ul>
                <li>
                  Make sure you clicked the correct verification link from your
                  email
                </li>
                <li>Verification links expire after 24 hours</li>
                <li>Check your spam folder for the verification email</li>
                <li>Contact support if the problem persists</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <FiLoader className={styles.loadingIcon} />
          <p>Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
