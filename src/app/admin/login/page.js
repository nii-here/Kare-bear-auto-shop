"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setIsLoggingIn(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      const adminRef = doc(db, "admins", user.uid);
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists()) {
        await signOut(auth);
        setError("You are not authorized to access the admin dashboard.");
        return;
      }

      router.push("/admin/dashboard");
    } catch (err) {
      setError("Invalid email, password, or admin access.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <main className="admin-page">
      <div className="admin-login-shell">
        <div className="admin-login-card">
          <div className="admin-login-top">
            <p className="admin-eyebrow">Admin Access</p>
            <h1 className="admin-heading">Login to Dashboard</h1>
            <p className="admin-description">
              Sign in to manage appointment requests, approve or deny bookings,
              and update available service days.
            </p>
          </div>

          <form className="admin-login-form" onSubmit={handleLogin}>
            <div className="admin-input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="admin-input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="admin-error">{error}</p>}

            <button
              type="submit"
              className="admin-login-btn"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="admin-login-footer">
            <Link href="/" className="admin-back-link">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}