"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import styles from "./verify-email.module.css";
import {
  FiCheckCircle,
  FiXCircle,
  FiMail,
  FiLoader,
  FiClock,
} from "react-icons/fi";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "expired"
  >("loading");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage(
        "Invalid verification link. Please check your email and try again.",
      );
      return;
    }
    verifyEmail(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await api.post("/corporate/verify-email", { token });

      if (response.data.success) {
        setStatus("success");
        setMessage("Your corporate email has been verified successfully!");

        const { accessToken, refreshToken, full_name, email, company_name } =
          response.data.data;

        // Auto-login: store tokens and user
        if (accessToken) {
          localStorage.setItem("token", accessToken);
          if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem(
            "user",
            JSON.stringify({
              email,
              full_name,
              company_name,
              role: "user",
              is_corporate_user: true,
              company_email_verified: true,
            }),
          );
          api.defaults.headers.common["Authorization"] =
            `Bearer ${accessToken}`;
        }

        // Redirect to home logged in
        setTimeout(() => router.push("/"), 3000);
      }
    } catch (error: unknown) {
      const err = error as {
        response?: {
          status?: number;
          data?: { message?: string; expired?: boolean };
        };
      };

      if (err.response?.status === 410 || err.response?.data?.expired) {
        setStatus("expired");
        setMessage(
          err.response?.data?.message ||
            "This verification link has expired. Request a new one below.",
        );
      } else {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "Failed to verify email. The link may be invalid.",
        );
      }
    }
  };

  const handleResend = async () => {
    if (!resendEmail) return;
    setIsResending(true);
    setResendError("");
    setResendDone(false);
    try {
      await api.post("/corporate/resend-verification", { email: resendEmail });
      setResendDone(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setResendError(
        e.response?.data?.message || "Failed to resend. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* LOADING */}
        {status === "loading" && (
          <>
            <div className={styles.iconContainer}>
              <FiLoader className={styles.spinner} size={64} />
            </div>
            <h1 className={styles.title}>Verifying Your Email</h1>
            <p className={styles.message}>Please waitâ€¦</p>
          </>
        )}

        {/* SUCCESS */}
        {status === "success" && (
          <>
            <div className={styles.iconContainer}>
              <FiCheckCircle className={styles.successIcon} size={64} />
            </div>
            <h1 className={styles.title}>Email Verified!</h1>
            <p className={styles.message}>{message}</p>
            <div className={styles.redirectMessage}>
              You are now logged in. Redirecting to home in 3 secondsâ€¦
            </div>
            <button
              onClick={() => router.push("/")}
              className={styles.primaryBtn}
            >
              Go to Home Now
            </button>
          </>
        )}

        {/* EXPIRED */}
        {status === "expired" && (
          <>
            <div className={styles.iconContainer}>
              <FiClock style={{ color: "#F59E0B" }} size={64} />
            </div>
            <h1 className={styles.title}>Link Expired</h1>
            <p className={styles.message}>{message}</p>
            <div className={styles.resendForm}>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "#6B7280",
                  marginBottom: "0.75rem",
                }}
              >
                Enter your corporate email to get a fresh verification link:
              </p>
              <input
                type="email"
                className={styles.resendInput}
                placeholder="your@company.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
              />
              {resendError && (
                <p
                  style={{
                    color: "#EF4444",
                    fontSize: "0.8125rem",
                    margin: "0.375rem 0 0",
                  }}
                >
                  {resendError}
                </p>
              )}
              {resendDone ? (
                <p
                  style={{
                    color: "#10B981",
                    fontSize: "0.875rem",
                    marginTop: "0.5rem",
                  }}
                >
                  âœ“ Verification email sent! Check your inbox.
                </p>
              ) : (
                <button
                  className={styles.primaryBtn}
                  onClick={handleResend}
                  disabled={isResending || !resendEmail}
                  style={{ marginTop: "0.75rem" }}
                >
                  <FiMail />
                  {isResending ? "Sendingâ€¦" : "Send New Link"}
                </button>
              )}
            </div>
            <button
              onClick={() => router.push("/")}
              className={styles.secondaryBtn}
            >
              Back to Home
            </button>
          </>
        )}

        {/* ERROR */}
        {status === "error" && (
          <>
            <div className={styles.iconContainer}>
              <FiXCircle className={styles.errorIcon} size={64} />
            </div>
            <h1 className={styles.title}>Verification Failed</h1>
            <p className={styles.message}>{message}</p>
            <div className={styles.resendForm}>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "#6B7280",
                  marginBottom: "0.75rem",
                }}
              >
                Enter your email to request a new verification link:
              </p>
              <input
                type="email"
                className={styles.resendInput}
                placeholder="your@company.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
              />
              {resendError && (
                <p
                  style={{
                    color: "#EF4444",
                    fontSize: "0.8125rem",
                    margin: "0.375rem 0 0",
                  }}
                >
                  {resendError}
                </p>
              )}
              {resendDone ? (
                <p
                  style={{
                    color: "#10B981",
                    fontSize: "0.875rem",
                    marginTop: "0.5rem",
                  }}
                >
                  âœ“ Verification email sent! Check your inbox.
                </p>
              ) : (
                <button
                  className={styles.primaryBtn}
                  onClick={handleResend}
                  disabled={isResending || !resendEmail}
                  style={{ marginTop: "0.75rem" }}
                >
                  <FiMail />
                  {isResending ? "Sendingâ€¦" : "Resend Verification Email"}
                </button>
              )}
            </div>
            <button
              onClick={() => router.push("/")}
              className={styles.secondaryBtn}
            >
              Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.card}>
            <FiLoader size={48} />
            <p>Loadingâ€¦</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
