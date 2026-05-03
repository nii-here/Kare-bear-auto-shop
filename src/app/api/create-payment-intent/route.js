import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { message: "Stripe secret key is missing." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const body = await request.json();
    const { name, email, service } = body;

    if (!name || !email || !service) {
      return NextResponse.json(
        { message: "Missing required customer details." },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000, // $20.00
      currency: "usd",
      capture_method: "manual",
      receipt_email: email,
      metadata: {
        name,
        email,
        service,
      },
    });

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Create payment intent error:", error);

    return NextResponse.json(
      {
        message: "Failed to create payment intent.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}