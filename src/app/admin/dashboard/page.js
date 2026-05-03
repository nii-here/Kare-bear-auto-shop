"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";

const dayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const timeOptions = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];

export default function AdminDashboardPage() {
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [viewFilter, setViewFilter] = useState("active");

  const [availableDays, setAvailableDays] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState("09:00");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/admin/login");
        return;
      }

      try {
        const adminRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {
          await signOut(auth);
          router.push("/admin/login");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Admin check failed:", error);
        router.push("/admin/login");
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!isAdmin) return;

    const appointmentsQuery = query(
      collection(db, "appointments"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      appointmentsQuery,
      (snapshot) => {
        const appointmentList = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setAppointments(appointmentList);
        setLoadingAppointments(false);
      },
      (error) => {
        console.error("Failed to load appointments:", error);
        setLoadingAppointments(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const availabilityRef = doc(db, "settings", "availability");

    const unsubscribe = onSnapshot(availabilityRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setAvailableDays(data.days || []);
        setAvailableTimes(data.times || []);
      } else {
        setAvailableDays([]);
        setAvailableTimes([]);
      }
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "Not available";

    return timestamp.toDate().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const filteredAppointments = appointments.filter((appointment) => {
    if (viewFilter === "active") return !appointment.isArchived;
    if (viewFilter === "archived") return appointment.isArchived;
    return true;
  });

  const saveAvailability = async (days, times) => {
    await setDoc(
      doc(db, "settings", "availability"),
      { days, times },
      { merge: true }
    );
  };

  const toggleDay = async (day) => {
    const updatedDays = availableDays.includes(day)
      ? availableDays.filter((item) => item !== day)
      : [...availableDays, day];

    try {
      await saveAvailability(updatedDays, availableTimes);
    } catch (error) {
      console.error("Failed to save day:", error);
      alert("Failed to update available days.");
    }
  };

  const addTime = async () => {
    if (availableTimes.includes(selectedTime)) {
      alert("That time is already added.");
      return;
    }

    const updatedTimes = [...availableTimes, selectedTime].sort();

    try {
      await saveAvailability(availableDays, updatedTimes);
    } catch (error) {
      console.error("Failed to save time:", error);
      alert("Failed to add available time.");
    }
  };

  const removeTime = async (timeToRemove) => {
    const updatedTimes = availableTimes.filter((time) => time !== timeToRemove);

    try {
      await saveAvailability(availableDays, updatedTimes);
    } catch (error) {
      console.error("Failed to remove time:", error);
      alert("Failed to remove available time.");
    }
  };

  const clearAvailability = async () => {
    const confirmClear = confirm("Clear all available days and times?");
    if (!confirmClear) return;

    try {
      await saveAvailability([], []);
    } catch (error) {
      console.error("Failed to clear availability:", error);
      alert("Failed to clear availability.");
    }
  };

  const sendStatusEmail = async (appointment, newStatus) => {
    await fetch("/api/send-status-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: appointment.name,
        email: appointment.email,
        date: appointment.day || appointment.date,
        time: appointment.time,
        service: appointment.service,
        status: newStatus,
      }),
    });
  };

  const capturePayment = async (paymentIntentId) => {
    const response = await fetch("/api/capture-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentIntentId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to capture payment.");
    }

    return data;
  };

  const cancelPayment = async (paymentIntentId) => {
    const response = await fetch("/api/cancel-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentIntentId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to cancel payment.");
    }

    return data;
  };

  const approveAppointment = async (appointment) => {
    try {
      setUpdatingId(appointment.id);

      if (appointment.stripePaymentIntentId) {
        await capturePayment(appointment.stripePaymentIntentId);
      }

      await updateDoc(doc(db, "appointments", appointment.id), {
        status: "Approved",
        paymentStatus: appointment.stripePaymentIntentId ? "charged" : "none",
      });

      await sendStatusEmail(appointment, "Approved");
    } catch (error) {
      console.error("Failed to approve appointment:", error);
      alert(error.message || "Failed to approve appointment.");
    } finally {
      setUpdatingId("");
    }
  };

  const denyAppointment = async (appointment) => {
    try {
      setUpdatingId(appointment.id);

      if (appointment.stripePaymentIntentId) {
        await cancelPayment(appointment.stripePaymentIntentId);
      }

      await updateDoc(doc(db, "appointments", appointment.id), {
        status: "Denied",
        paymentStatus: appointment.stripePaymentIntentId
          ? "authorization_canceled"
          : "none",
      });

      await sendStatusEmail(appointment, "Denied");
    } catch (error) {
      console.error("Failed to deny appointment:", error);
      alert(error.message || "Failed to deny appointment.");
    } finally {
      setUpdatingId("");
    }
  };

  const archiveAppointment = async (appointment) => {
    try {
      setUpdatingId(appointment.id);

      await updateDoc(doc(db, "appointments", appointment.id), {
        isArchived: true,
        archivedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to archive appointment:", error);
      alert("Failed to archive appointment.");
    } finally {
      setUpdatingId("");
    }
  };

  const restoreAppointment = async (appointment) => {
    try {
      setUpdatingId(appointment.id);

      await updateDoc(doc(db, "appointments", appointment.id), {
        isArchived: false,
      });
    } catch (error) {
      console.error("Failed to restore appointment:", error);
      alert("Failed to restore appointment.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  const pendingCount = appointments.filter(
    (a) =>
      !a.isArchived &&
      (a.status === "Pending Approval" || a.status === "Pending")
  ).length;

  const approvedCount = appointments.filter(
    (a) => !a.isArchived && a.status === "Approved"
  ).length;

  const deniedCount = appointments.filter(
    (a) => !a.isArchived && a.status === "Denied"
  ).length;

  const archivedCount = appointments.filter((a) => a.isArchived).length;

  const getStatusClass = (status) => {
    if (status === "Approved") return "status-approved";
    if (status === "Denied") return "status-denied";
    return "status-pending";
  };

  if (authLoading || loadingAppointments) {
    return (
      <main className="dashboard-page">
        <p style={{ textAlign: "center" }}>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-wrapper">
        <header className="dashboard-hero">
          <div className="dashboard-hero-text">
            <p className="dashboard-eyebrow">Admin Dashboard</p>
            <h1>Kare Bear Auto Shop</h1>
            <p>
              Manage appointments, requests, payments, and booking availability.
            </p>
          </div>

          <div className="dashboard-hero-actions">
            <Link href="/" className="dashboard-outline-btn">
              Home
            </Link>
            <button onClick={handleLogout} className="dashboard-primary-btn">
              Logout
            </button>
          </div>
        </header>

        <section className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-label">Pending Review</span>
            <strong>{pendingCount}</strong>
          </div>

          <div className="stat-card">
            <span className="stat-label">Approved</span>
            <strong>{approvedCount}</strong>
          </div>

          <div className="stat-card">
            <span className="stat-label">Denied</span>
            <strong>{deniedCount}</strong>
          </div>

          <div className="stat-card">
            <span className="stat-label">Archived</span>
            <strong>{archivedCount}</strong>
          </div>
        </section>

        <section className="dashboard-section availability-layout">
          <article className="availability-panel">
            <div className="section-header">
              <div>
                <p className="section-kicker">Availability</p>
                <h2>Choose Available Days</h2>
              </div>
            </div>

            <div className="day-picker-grid">
              {dayOptions.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`day-picker-btn ${
                    availableDays.includes(day) ? "selected" : ""
                  }`}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="chip-list availability-preview">
              {availableDays.length === 0 ? (
                <p className="request-service">No available days selected yet.</p>
              ) : (
                availableDays.map((day) => (
                  <div className="day-chip" key={day}>
                    <span>{day}</span>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="availability-panel">
            <div className="section-header">
              <div>
                <p className="section-kicker">Availability</p>
                <h2>Choose Available Times</h2>
              </div>
            </div>

            <div className="availability-input-row">
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>

              <button
                className="dashboard-primary-btn small-btn"
                onClick={addTime}
              >
                Add Time
              </button>
            </div>

            <div className="availability-input-row">
              <button className="deny-btn" onClick={clearAvailability}>
                Clear All Availability
              </button>
            </div>

            <div className="chip-list">
              {availableTimes.length === 0 ? (
                <p className="request-service">No available times selected yet.</p>
              ) : (
                availableTimes.map((time) => (
                  <div className="day-chip" key={time}>
                    <span>{time}</span>
                    <button onClick={() => removeTime(time)}>×</button>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <div>
              <p className="section-kicker">Bookings</p>
              <h2>Appointment Requests</h2>
            </div>
          </div>

          <div className="dashboard-filter-row">
            <button
              className={`filter-btn ${viewFilter === "active" ? "selected" : ""}`}
              onClick={() => setViewFilter("active")}
            >
              Active
            </button>

            <button
              className={`filter-btn ${
                viewFilter === "archived" ? "selected" : ""
              }`}
              onClick={() => setViewFilter("archived")}
            >
              Archived
            </button>

            <button
              className={`filter-btn ${viewFilter === "all" ? "selected" : ""}`}
              onClick={() => setViewFilter("all")}
            >
              All
            </button>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="request-card">
              <h3>No appointment requests found.</h3>
              <p className="request-service">
                Requests will appear here based on your selected filter.
              </p>
            </div>
          ) : (
            <div className="request-grid">
              {filteredAppointments.map((appointment) => (
                <article className="request-card" key={appointment.id}>
                  <div className="request-card-top">
                    <h3>{appointment.name}</h3>

                    <span
                      className={`status-badge ${getStatusClass(
                        appointment.status
                      )}`}
                    >
                      {appointment.status}
                    </span>
                  </div>

                  <div className="request-details">
                    <p>
                      <span>Service</span>
                      {appointment.service}
                    </p>
                    <p>
                      <span>Email</span>
                      {appointment.email}
                    </p>
                    <p>
                      <span>Phone</span>
                      {appointment.phone}
                    </p>
                    <p>
                      <span>Booked</span>
                      {formatDate(appointment.createdAt)}
                    </p>
                    <p>
                      <span>Day</span>
                      {appointment.day || appointment.date}
                    </p>
                    <p>
                      <span>Time</span>
                      {appointment.time}
                    </p>
                    <p>
                      <span>Payment</span>
                      {appointment.paymentStatus || "Not available"}
                    </p>
                    {appointment.depositAmount && (
                      <p>
                        <span>Deposit</span>${appointment.depositAmount}
                      </p>
                    )}
                    {appointment.isArchived && (
                      <p>
                        <span>Archived</span>
                        {formatDate(appointment.archivedAt)}
                      </p>
                    )}
                    {appointment.notes && (
                      <p>
                        <span>Notes</span>
                        {appointment.notes}
                      </p>
                    )}
                  </div>

                  <div className="request-actions">
                    {appointment.status === "Pending Approval" ||
                    appointment.status === "Pending" ? (
                      <>
                        <button
                          className="approve-btn"
                          disabled={updatingId === appointment.id}
                          onClick={() => approveAppointment(appointment)}
                        >
                          {updatingId === appointment.id
                            ? "Processing..."
                            : "Approve & Charge"}
                        </button>

                        <button
                          className="deny-btn"
                          disabled={updatingId === appointment.id}
                          onClick={() => denyAppointment(appointment)}
                        >
                          {updatingId === appointment.id
                            ? "Processing..."
                            : "Deny"}
                        </button>
                      </>
                    ) : appointment.isArchived ? (
                      <button
                        className="edit-btn"
                        disabled={updatingId === appointment.id}
                        onClick={() => restoreAppointment(appointment)}
                      >
                        {updatingId === appointment.id
                          ? "Restoring..."
                          : "Restore"}
                      </button>
                    ) : (
                      <>
                        <button className="edit-btn" disabled>
                          Finalized
                        </button>

                        <button
                          className="dashboard-outline-btn"
                          disabled={updatingId === appointment.id}
                          onClick={() => archiveAppointment(appointment)}
                        >
                          {updatingId === appointment.id
                            ? "Archiving..."
                            : "Archive"}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}