import { NextResponse } from "next/server";
import { Resend } from "resend";


const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();

    const { name, email, phone, date, time, service, notes } = body;

    if (!name || !email || !phone || !date || !time || !service) {
      return NextResponse.json(
        { message: "Missing required appointment details." },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      return NextResponse.json(
        { message: "Admin email is not configured." },
        { status: 500 }
      );
    }

    await resend.emails.send({
      from: "Kare Bear Auto Shop <onboarding@resend.dev>",
      to: adminEmail,
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

    await resend.emails.send({
      from: "Kare Bear Auto Shop <onboarding@resend.dev>",
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

    return NextResponse.json(
      { message: "Appointment emails sent successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email send error:", error);

    return NextResponse.json(
      { message: "Failed to send appointment emails." },
      { status: 500 }
    );
  }
}