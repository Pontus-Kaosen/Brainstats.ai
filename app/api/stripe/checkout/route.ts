import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type Plan = "pro" | "elite";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const plan = body.plan as Plan;
    const email =
      typeof body.email === "string" ? body.email.trim() : "";
    const userId =
      typeof body.userId === "string" ? body.userId.trim() : "";

    const priceId =
      plan === "pro"
        ? process.env.STRIPE_PRO_PRICE_ID
        : plan === "elite"
          ? process.env.STRIPE_ELITE_PRICE_ID
          : null;

    if (!priceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Ogiltig plan eller Price ID saknas.",
        },
        { status: 400 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      success_url: `${appUrl}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/premium`,

      customer_email: email || undefined,

      allow_promotion_codes: true,

      metadata: {
        plan,
        userId,
      },

      subscription_data: {
        metadata: {
          plan,
          userId,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        {
          success: false,
          error: "Stripe skapade ingen Checkout-länk.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error: unknown) {
    console.error("Stripe Checkout error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Checkout kunde inte skapas.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}