// Required env vars:
//   STRIPE_SECRET_KEY          — Stripe secret key (sk_live_... or sk_test_...)
//   NEXT_PUBLIC_STRIPE_PRICE_ID — Stripe Price ID for the Pro plan ($29/month)

import { NextResponse } from "next/server";
import { z } from "zod";

const CheckoutInput = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
});

export type CheckoutInputT = z.infer<typeof CheckoutInput>;

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const validation = CheckoutInput.safeParse(payload);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { userId, email } = validation.data;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return NextResponse.json(
        { ok: false, error: "Payment service is not configured." },
        { status: 503 }
      );
    }

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    if (!priceId) {
      console.error("NEXT_PUBLIC_STRIPE_PRICE_ID is not configured");
      return NextResponse.json(
        { ok: false, error: "Payment service is not configured." },
        { status: 503 }
      );
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const body = new URLSearchParams({
      "mode": "subscription",
      "customer_email": email,
      "client_reference_id": userId,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "success_url": `${origin}/settings?checkout=success`,
      "cancel_url": `${origin}/settings?checkout=cancelled`,
    });

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Stripe API error:", errorData);
      return NextResponse.json(
        { ok: false, error: "Failed to create checkout session." },
        { status: 502 }
      );
    }

    const session = (await response.json()) as { url: string };

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
