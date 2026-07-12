import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

type BrainPlan = "free" | "pro" | "elite";

function getPlanFromSubscription(
  subscription: Stripe.Subscription
): BrainPlan {
  const metadataPlan = subscription.metadata?.plan;

  if (metadataPlan === "pro" || metadataPlan === "elite") {
    return metadataPlan;
  }

  const priceId = subscription.items.data[0]?.price?.id;

  if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return "pro";
  }

  if (priceId === process.env.STRIPE_ELITE_PRICE_ID) {
    return "elite";
  }

  return "free";
}

async function updateProfileFromSubscription(
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error("Stripe subscription saknar userId:", subscription.id);
    return;
  }

  const plan = getPlanFromSubscription(subscription);

  const activeStatuses = ["active", "trialing", "past_due"];
  const profilePlan: BrainPlan = activeStatuses.includes(subscription.status)
    ? plan
    : "free";

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const currentPeriodEnd =
    subscription.items.data[0]?.current_period_end;

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: userId,
        plan: profilePlan,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        current_period_end: currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

  if (error) {
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      {
        success: false,
        error: "Stripe-signatur eller webhook-hemlighet saknas.",
      },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("Stripe webhook signature error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Ogiltig Stripe-signatur.",
      },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await updateProfileFromSubscription(subscription);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (
          session.mode === "subscription" &&
          typeof session.subscription === "string"
        ) {
          const subscription =
            await stripe.subscriptions.retrieve(session.subscription);

          await updateProfileFromSubscription(subscription);
        }

        break;
      }

      default:
        console.log(`Stripe-event ignorerades: ${event.type}`);
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Webhooken kunde inte behandlas.",
      },
      { status: 500 }
    );
  }
}