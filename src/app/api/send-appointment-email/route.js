import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request) {
  try {
    console.log("🚀 API HIT: send-appointment-email");

    const body = await request.json();

    const { name, email, phone, date, time, service, notes } = body;

    if (!name || !email || !phone || !date || !time || !service) {
      console.error("❌ Missing fields:", body);
      return NextResponse.json(
        { message: "Missing required appointment details." },
        { status: 400 }
      );
    }

    // 🔍 LOG ENV VARIABLES (CRITICAL FOR DEBUGGING)
    console.log("ENV CHECK:");
    console.log("API KEY:", process.env.RESEND_API_KEY ? "✅ EXISTS" : "❌ MISSING");
    console.log("ADMIN EMAIL:", process.env.ADMIN_EMAIL);
    console.log("FROM EMAIL:", process.env.RESEND_FROM_EMAIL);

    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing");
    }

    if (!process.env.ADMIN_EMAIL) {
      throw new Error("ADMIN_EMAIL is missing");
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      throw new Error("RESEND_FROM_EMAIL is missing");
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // 📩 SEND ADMIN EMAIL
    const adminResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: "New Appointment Request",
      html: `
        <h2>New Appointment Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Notes:</strong> ${notes || "No notes provided"}</p>
      `,
    });

    console.log("✅ Admin email result:", adminResult);

    // 📩 SEND CUSTOMER EMAIL
    const customerResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: "We received your appointment request",
      html: `
        <h2>Appointment Request Received</h2>
        <p>Hi ${name},</p>
        <p>Thanks for requesting an appointment with Kare Bear Auto Shop.</p>
        <p>We received your request and will review it soon.</p>

        <h3>Your Request</h3>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>

        <p>We’ll contact you once your appointment is reviewed.</p>
      `,
    });

    console.log("✅ Customer email result:", customerResult);

    return NextResponse.json(
      { message: "Emails sent successfully." },
      { status: 200 }
    );

  } catch (error) {
    console.error("🔥 EMAIL ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to send emails",
        error: error.message,
      },
      { status: 500 }
    );
  }
}