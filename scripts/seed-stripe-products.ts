import { getUncachableStripeClient } from '../server/stripeClient';

async function seedProducts() {
  console.log('Creating Stripe products and prices...');
  
  const stripe = await getUncachableStripeClient();

  const products = [
    {
      name: 'Growth',
      description: 'Perfect for growing teams. 5 active jobs, 25 candidates/month, 15 AI actions per candidate.',
      metadata: { 
        plan: 'growth',
        jobs: '5',
        candidates: '25',
        aiActionsPerCandidate: '15',
      },
      price: 2900,
    },
    {
      name: 'Pro',
      description: 'For established HR teams. 20 active jobs, 150 candidates/month, 20 AI actions per candidate.',
      metadata: { 
        plan: 'pro',
        jobs: '20',
        candidates: '150',
        aiActionsPerCandidate: '20',
      },
      price: 4999,
    },
    {
      name: 'Enterprise',
      description: 'Unlimited scale for large organizations. Unlimited jobs, 1000+ candidates/month, 10 AI actions per candidate.',
      metadata: { 
        plan: 'enterprise',
        jobs: 'unlimited',
        candidates: '1000+',
        aiActionsPerCandidate: '10',
      },
      price: 15000,
    },
  ];

  for (const productData of products) {
    const existingProducts = await stripe.products.search({ 
      query: `name:'${productData.name}'` 
    });

    if (existingProducts.data.length > 0) {
      console.log(`Product "${productData.name}" already exists, skipping...`);
      continue;
    }

    const product = await stripe.products.create({
      name: productData.name,
      description: productData.description,
      metadata: productData.metadata,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: productData.price,
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    console.log(`Created: ${productData.name} (${product.id}) with price ${price.id} ($${productData.price / 100}/mo)`);
  }

  console.log('\nDone! Products have been created in Stripe.');
  console.log('They will be automatically synced to the database via webhooks.');
}

seedProducts().catch(console.error);
