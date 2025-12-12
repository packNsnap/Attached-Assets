import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import type { PlanType } from '@shared/schema';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    
    // Process the webhook with stripe-replit-sync first
    await sync.processWebhook(payload, signature, uuid);

    // Parse the event to handle custom logic
    try {
      const event = JSON.parse(payload.toString());
      await WebhookHandlers.handleCustomEvents(event);
    } catch (error) {
      console.error('Error processing custom webhook event:', error);
    }
  }

  static async handleCustomEvents(event: any): Promise<void> {
    console.log(`Received webhook ${event.id}: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await WebhookHandlers.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await WebhookHandlers.handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await WebhookHandlers.handleSubscriptionDeleted(event.data.object);
        break;
    }
  }

  static async handleCheckoutCompleted(session: any): Promise<void> {
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as PlanType;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (!userId || !plan) {
      console.log('Checkout completed but missing userId or plan in metadata');
      return;
    }

    console.log(`Checkout completed for user ${userId}, plan: ${plan}, subscription: ${subscriptionId}`);

    try {
      // Update the user's subscription in our database
      const existingSub = await storage.getSubscription(userId);
      
      if (existingSub) {
        await storage.updateSubscription(userId, {
          plan,
          status: 'active',
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
        });
      } else {
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        await storage.createSubscription({
          userId,
          plan,
          status: 'active',
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          currentPeriodStart: now,
          currentPeriodEnd: endOfMonth,
        });
      }

      console.log(`Subscription updated for user ${userId} to plan ${plan}`);
    } catch (error) {
      console.error('Error updating subscription after checkout:', error);
    }
  }

  static async handleSubscriptionUpdate(subscription: any): Promise<void> {
    const subscriptionId = subscription.id;
    const status = subscription.status;
    const customerId = subscription.customer;

    console.log(`Subscription ${subscriptionId} updated, status: ${status}`);

    try {
      // Find the subscription by Stripe subscription ID
      const existingSub = await storage.getSubscriptionByStripeCustomerId(customerId);
      
      if (existingSub) {
        // Map Stripe status to our status
        let ourStatus: 'active' | 'canceled' | 'past_due' = 'active';
        if (status === 'canceled' || status === 'unpaid') {
          ourStatus = 'canceled';
        } else if (status === 'past_due') {
          ourStatus = 'past_due';
        }

        await storage.updateSubscription(existingSub.userId, {
          status: ourStatus,
          stripeSubscriptionId: subscriptionId,
        });
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  }

  static async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const customerId = subscription.customer;

    console.log(`Subscription deleted for customer ${customerId}`);

    try {
      const existingSub = await storage.getSubscriptionByStripeCustomerId(customerId);
      
      if (existingSub) {
        // Downgrade to free plan
        await storage.updateSubscription(existingSub.userId, {
          plan: 'free',
          status: 'active',
          stripeSubscriptionId: null,
        });
        console.log(`User ${existingSub.userId} downgraded to free plan`);
      }
    } catch (error) {
      console.error('Error handling subscription deletion:', error);
    }
  }
}
