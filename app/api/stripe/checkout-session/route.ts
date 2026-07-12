import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Session ID saknas.",
        },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid =
      session.payment_status === "paid" ||
      session.status === "complete";

    return NextResponse.json({
      success: true,
      paid,
      status: session.status,
      paymentStatus: session.payment_status,
      plan: session.metadata?.plan || null,
      customerEmail:
        session.customer_details?.email ||
        session.customer_email ||
        null,
    });
  } catch (error) {
    console.error("Checkout session error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Checkout-sessionen kunde inte hämtas.",
      },
      { status: 500 }
    );
  }
}