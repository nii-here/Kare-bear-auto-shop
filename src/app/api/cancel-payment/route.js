import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { message: "Missing payment intent ID." },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

    return NextResponse.json(
      { message: "Payment authorization canceled.", paymentIntent },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cancel payment error:", error);

    return NextResponse.json(
      { message: "Failed to cancel payment.", error: error.message },
      { status: 500 }
    );
  }
}