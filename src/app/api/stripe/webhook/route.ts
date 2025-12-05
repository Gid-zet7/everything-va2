import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get("Stripe-Signature") as string;
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (error) {
        return new NextResponse("webhook error", { status: 400 });
    }

    // console.log(event.type)

    // new subscription created
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        if (!subscriptionId) {
            return new NextResponse("missing subscription id", { status: 400 });
        }
        const subscription = await stripe.subscriptions.retrieve(
            subscriptionId,
            {
                expand: ['items.data.price.product'],
            }
        );
        if (!session?.client_reference_id) {
            return new NextResponse("no userid", { status: 400 });
        }
        const plan = subscription.items.data[0]?.price;

        if (!plan) {
            throw new Error('No plan found for this subscription.');
        }

        const productId = (plan.product as Stripe.Product).id;

        if (!productId) {
            throw new Error('No product ID found for this subscription.');
        }

        const createData: any = {
            subscriptionId: subscription.id,
            productId: productId,
            priceId: plan.id,
            customerId: subscription.customer as string,
            userId: session.client_reference_id,
        };
        if (subscription.current_period_end) {
            createData.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        }
        const stripeSubscription = await db.stripeSubscription.create({
            data: createData
        })

        return NextResponse.json({ message: "success" }, { status: 200 });
    }

    if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
        if (!subscriptionId) {
            return new NextResponse("missing subscription id on invoice", { status: 400 });
        }
        const subscription = await stripe.subscriptions.retrieve(
            subscriptionId,
            {
                expand: ['items.data.price.product'],
            }
        );
        const plan = subscription.items.data[0]?.price;

        if (!plan) {
            throw new Error('No plan found for this subscription.');
        }

        const productId = (plan.product as Stripe.Product).id;

        const updateData: any = {
            productId: productId,
            priceId: plan.id,
        };
        if (subscription.current_period_end) {
            updateData.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        }
        await db.stripeSubscription.update({
            where: {
                subscriptionId: subscription.id
            },
            data: updateData
        })
        return NextResponse.json({ message: "success" }, { status: 200 });
    }

    if (event.type === 'customer.subscription.updated') {
        const subscriptionEventObj = event.data.object as Stripe.Subscription;
        const subscription = subscriptionEventObj;
        const updateData: any = {
            updatedAt: new Date(),
        };
        if (subscription.current_period_end) {
            updateData.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        }
        await db.stripeSubscription.update({
            where: {
                subscriptionId: subscription.id as string
            },
            data: updateData
        })
        return NextResponse.json({ message: "success" }, { status: 200 });
    }


    return NextResponse.json({ message: "success" }, { status: 200 });

} 