"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

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

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  const [availableDays, setAvailableDays] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState("09:00");

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isAdminLoggedIn");

    if (isLoggedIn !== "true") {
      router.push("/admin/login");
    }
  }, [router]);

  useEffect(() => {
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
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load appointments:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
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
  }, []);

  const saveAvailability = async (days, times) => {
    await setDoc(
      doc(db, "settings", "availability"),
      {
        days,
        times,
      },
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
        date: appointment.date,
        time: appointment.time,
        service: appointment.service,
        status: newStatus,
      }),
    });
  };

  const updateStatus = async (appointment, newStatus) => {
    try {
      setUpdatingId(appointment.id);

      await updateDoc(doc(db, "appointments", appointment.id), {
        status: newStatus,
      });

      if (newStatus === "Approved" || newStatus === "Denied") {
        await sendStatusEmail(appointment, newStatus);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update appointment status.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    router.push("/admin/login");
  };

  const pendingCount = appointments.filter((a) => a.status === "Pending").length;
  const approvedCount = appointments.filter((a) => a.status === "Approved").length;
  const deniedCount = appointments.filter((a) => a.status === "Denied").length;

  if (loading) {
    return (
      <main className="dashboard-page">
        <p style={{ textAlign: "center" }}>Loading appointments...</p>
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
            <p>Manage appointments, requests, and booking availability.</p>
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
            <span className="stat-label">Pending</span>
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

              <button className="dashboard-primary-btn small-btn" onClick={addTime}>
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

          {appointments.length === 0 ? (
            <div className="request-card">
              <h3>No appointment requests yet.</h3>
              <p className="request-service">
                New customer requests will appear here.
              </p>
            </div>
          ) : (
            <div className="request-grid">
              {appointments.map((appointment) => (
                <article className="request-card" key={appointment.id}>
                  <div className="request-card-top">
                    <h3>{appointment.name}</h3>

                    <span
                      className={`status-badge status-${appointment.status.toLowerCase()}`}
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
                      <span>Day</span>
                      {appointment.day || appointment.date}
                    </p>
                    <p>
                      <span>Time</span>
                      {appointment.time}
                    </p>
                    {appointment.notes && (
                      <p>
                        <span>Notes</span>
                        {appointment.notes}
                      </p>
                    )}
                  </div>

                  <div className="request-actions">
                    {appointment.status === "Pending" ? (
                      <>
                        <button
                          className="approve-btn"
                          disabled={updatingId === appointment.id}
                          onClick={() => updateStatus(appointment, "Approved")}
                        >
                          {updatingId === appointment.id ? "Updating..." : "Approve"}
                        </button>

                        <button
                          className="deny-btn"
                          disabled={updatingId === appointment.id}
                          onClick={() => updateStatus(appointment, "Denied")}
                        >
                          {updatingId === appointment.id ? "Updating..." : "Deny"}
                        </button>
                      </>
                    ) : (
                      <button
                        className="edit-btn"
                        disabled={updatingId === appointment.id}
                        onClick={() => updateStatus(appointment, "Pending")}
                      >
                        {updatingId === appointment.id ? "Updating..." : "Edit"}
                      </button>
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