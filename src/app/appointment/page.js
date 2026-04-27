"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

const services = [
  "Oil Change",
  "Brake Inspection",
  "Tire Rotation",
  "Diagnostic Check",
  "General Repair",
];

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  day: "",
  time: "",
  service: "",
  notes: "",
};

export default function AppointmentPage() {
  const [formData, setFormData] = useState(initialFormData);
  const [availableDays, setAvailableDays] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadAvailability = async () => {
      try {
        const availabilityRef = doc(db, "settings", "availability");
        const snapshot = await getDoc(availabilityRef);

        if (snapshot.exists()) {
          const data = snapshot.data();

          setAvailableDays(data.days || []);
          setAvailableTimes(data.times || []);
        } else {
          setAvailableDays([]);
          setAvailableTimes([]);
        }
      } catch (err) {
        console.error("Availability load error:", err);
        setError("Unable to load available appointment times.");
      } finally {
        setLoadingAvailability(false);
      }
    };

    loadAvailability();
  }, []);

  const handleChange = (e) => {
    setSubmitted(false);
    setError("");

    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleServiceSelect = (service) => {
    setSubmitted(false);
    setError("");

    setFormData((prev) => ({
      ...prev,
      service,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Please enter your name.";
    if (!formData.email.trim()) return "Please enter your email.";
    if (!formData.phone.trim()) return "Please enter your phone number.";
    if (!formData.service) return "Please select a service.";
    if (!formData.day) return "Please select an available day.";
    if (!formData.time) return "Please select an available time.";

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const appointmentData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        day: formData.day,
        time: formData.time,
        service: formData.service,
        notes: formData.notes.trim(),
        status: "Pending",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "appointments"), appointmentData);

      await fetch("/api/send-appointment-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: appointmentData.name,
          email: appointmentData.email,
          phone: appointmentData.phone,
          date: appointmentData.day,
          time: appointmentData.time,
          service: appointmentData.service,
          notes: appointmentData.notes,
        }),
      });

      setSubmitted(true);
      setFormData(initialFormData);
    } catch (err) {
      console.error("Appointment submit error:", err);
      setError("Unable to submit appointment request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="appointment-page appointment-page-pro">
      <section className="appointment-card appointment-card-pro">
        <div className="appointment-header">
          <p className="appointment-eyebrow">Schedule Service</p>
          <h1>Request an Appointment</h1>
          <p className="appointment-subtitle">
            Choose your service, select an available day and time, and Kare Bear
            Auto Shop will review your request.
          </p>
        </div>

        {submitted ? (
          <div className="appointment-confirmation">
            <div className="confirmation-icon">✓</div>

            <h2>Request Sent</h2>

            <p>
              Your appointment request has been submitted successfully. You will
              receive an email once your request is approved or denied.
            </p>

            <Link
              href="/"
              className="appointment-submit-btn confirmation-home-btn"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}

            <form className="appointment-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="appointment-input-group">
                  <label>Name</label>
                  <input
                    name="name"
                    type="text"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="appointment-input-group">
                  <label>Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="appointment-input-group">
                  <label>Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="appointment-input-group">
                  <label>Service</label>

                  <div className="service-options">
                    {services.map((service) => (
                      <button
                        type="button"
                        key={service}
                        className={`service-option ${
                          formData.service === service ? "selected" : ""
                        }`}
                        onClick={() => handleServiceSelect(service)}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="appointment-input-group">
                  <label>Available Day</label>
                  <select
                    name="day"
                    value={formData.day}
                    onChange={handleChange}
                    required
                    disabled={loadingAvailability || availableDays.length === 0}
                  >
                    <option value="">
                      {loadingAvailability
                        ? "Loading days..."
                        : availableDays.length === 0
                        ? "No days available"
                        : "Select a day"}
                    </option>

                    {availableDays.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="appointment-input-group">
                  <label>Available Time</label>
                  <select
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    disabled={
                      loadingAvailability || availableTimes.length === 0
                    }
                  >
                    <option value="">
                      {loadingAvailability
                        ? "Loading times..."
                        : availableTimes.length === 0
                        ? "No times available"
                        : "Select a time"}
                    </option>

                    {availableTimes.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="appointment-input-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  placeholder="Tell us what’s going on with your vehicle..."
                  value={formData.notes}
                  onChange={handleChange}
                  rows="5"
                />
              </div>

              <button
                type="submit"
                className="appointment-submit-btn"
                disabled={
                  isSubmitting ||
                  loadingAvailability ||
                  availableDays.length === 0 ||
                  availableTimes.length === 0
                }
              >
                {isSubmitting ? "Submitting..." : "Submit Appointment Request"}
              </button>
            </form>

            <Link href="/" className="appointment-back-link">
              ← Back to Home
            </Link>
          </>
        )}
      </section>
    </main>
  );
}