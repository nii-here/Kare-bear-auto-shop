import { NextResponse } from "next/server";
import { Resend } from "resend";


const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { name, email, date, time, service, status } = await request.json();

    if (!name || !email || !date || !time || !service || !status) {
      return NextResponse.json(
        { message: "Missing required email details." },
        { status: 400 }
      );
    }

    const isApproved = status === "Approved";

    await resend.emails.send({
      from: "Kare Bear Auto <appointments@karebearauto.com>",
      to: email,
      subject: isApproved
        ? "Your appointment request was approved"
        : "Your appointment request was denied",
      html: `
        <h2>${isApproved ? "Appointment Approved" : "Appointment Denied"}</h2>

        <p>Hi ${name},</p>

        <p>
          Your appointment request for <strong>${service}</strong> on
          <strong>${date}</strong> at <strong>${time}</strong>
          has been <strong>${status.toLowerCase()}</strong>.
        </p>

        ${
          isApproved
            ? "<p>Please arrive on time. We look forward to seeing you.</p>"
            : "<p>Please submit another request with a different date or time if needed.</p>"
        }

        <p>Thank you,<br/>Kare Bear Auto Shop</p>
      `,
    });

    return NextResponse.json(
      { message: "Status email sent successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Status email error:", error);

    return NextResponse.json(
      { message: "Failed to send status email." },
      { status: 500 }
    );
  }
}