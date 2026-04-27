import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;
    const fromEmail =
      process.env.RESEND_FROM_EMAIL ||
      "Kare Bear Auto <appointments@karebearauto.com>";

    if (!resendApiKey) {
      return NextResponse.json(
        { message: "Resend API key is not configured." },
        { status: 500 }
      );
    }

    if (!adminEmail) {
      return NextResponse.json(
        { message: "Admin email is not configured." },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    const body = await request.json();
    const { name, email, phone, date, time, service, notes } = body;

    if (!name || !email || !phone || !date || !time || !service) {
      return NextResponse.json(
        { message: "Missing required appointment details." },
        { status: 400 }
      );
    }

    const adminResult = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: "New Appointment Request",
      html: `
        <h2>New Appointment Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Day/Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Notes:</strong> ${notes || "No notes provided"}</p>
      `,
    });

    const customerResult = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "We received your appointment request",
      html: `
        <h2>Appointment Request Received</h2>
        <p>Hi ${name},</p>
        <p>Thanks for requesting an appointment with Kare Bear Auto Shop.</p>
        <p>We received your request and will review it soon.</p>

        <h3>Your Request</h3>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Day/Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>

        <p>You will receive another email once your appointment is approved or denied.</p>
      `,
    });

    return NextResponse.json(
      {
        message: "Appointment emails sent successfully.",
        adminResult,
        customerResult,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email send error:", error);

    return NextResponse.json(
      { message: "Failed to send appointment emails.", error: error.message },
      { status: 500 }
    );
  }
}