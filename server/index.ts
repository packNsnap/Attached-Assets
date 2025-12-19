import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync, getUncachableStripeClient } from "./stripeClient";
import { WebhookHandlers } from "./webhookHandlers";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('DATABASE_URL not set - skipping Stripe initialization');
    return;
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ 
      databaseUrl,
      schema: 'stripe'
    });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();

    console.log('Setting up managed webhook...');
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const { webhook, uuid } = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`,
      {
        enabled_events: ['*'],
        description: 'Managed webhook for Stripe sync',
      }
    );
    console.log(`Webhook configured: ${webhook.url} (UUID: ${uuid})`);

    console.log('Syncing Stripe data...');
    await stripeSync.syncBackfill();
    console.log('Stripe data synced');
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

app.post(
  '/api/stripe/webhook/:uuid',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      const { uuid } = req.params;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Serve uploaded files (reports, etc.)
app.use('/uploads', express.static('public/uploads'));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

async function seedStripeProducts() {
  try {
    const stripe = await getUncachableStripeClient();

    const products = [
      {
        name: 'Basic',
        description: 'Ideal for small businesses hiring occasionally. 25 candidates, 2 scans per candidate.',
        metadata: { 
          plan: 'basic',
          candidates: '25',
        },
        price: 2900,
      },
      {
        name: 'Growth',
        description: 'For growing companies. 75 candidates, advanced AI features.',
        metadata: { 
          plan: 'growth',
          candidates: '75',
        },
        price: 5900,
      },
      {
        name: 'Pro',
        description: 'For agencies and large teams. 200 candidates, team management.',
        metadata: { 
          plan: 'pro',
          candidates: '200',
        },
        price: 14900,
      },
      {
        name: 'Enterprise',
        description: 'Full-scale HR for large organizations. 500 candidates, API access.',
        metadata: { 
          plan: 'enterprise',
          candidates: '500',
        },
        price: -1,
      },
    ];

    for (const productData of products) {
      try {
        const existingProducts = await stripe.products.search({ 
          query: `name:'${productData.name}'` 
        });

        let product;
        if (existingProducts.data.length > 0) {
          // Update existing product
          product = existingProducts.data[0];
          await stripe.products.update(product.id, {
            description: productData.description,
            metadata: productData.metadata,
          });
          log(`Updated Stripe product: ${productData.name}`, "stripe-seed");
        } else {
          // Create new product
          product = await stripe.products.create({
            name: productData.name,
            description: productData.description,
            metadata: productData.metadata,
          });
          log(`Created Stripe product: ${productData.name}`, "stripe-seed");
        }

        // Create new price (skip for custom-priced products like Enterprise)
        if (productData.price > 0) {
          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: productData.price,
            currency: 'usd',
            recurring: { interval: 'month' },
          });
          log(`Created price for ${productData.name}: $${productData.price / 100}/mo`, "stripe-seed");
        } else {
          log(`Skipped price creation for ${productData.name} (custom pricing)`, "stripe-seed");
        }
      } catch (error) {
        log(`Error with product ${productData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, "stripe-seed");
      }
    }
  } catch (error) {
    log(`Failed to seed Stripe products: ${error instanceof Error ? error.message : 'Unknown error'}`, "stripe-seed");
  }
}

async function createAdminUser() {
  const adminEmail = "admin@resumelogik.com";
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    log("ADMIN_PASSWORD not set - skipping admin user creation", "admin");
    return;
  }
  
  try {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Check if admin already exists
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    if (existingAdmin) {
      // Update password to match current ADMIN_PASSWORD secret
      await storage.upsertUser({
        id: existingAdmin.id,
        email: adminEmail,
        password: hashedPassword,
        firstName: existingAdmin.firstName || "Admin",
        lastName: existingAdmin.lastName || "User",
      });
      log("Admin user password synced", "admin");
      return;
    }
    
    // Create admin user with hashed password
    await storage.upsertUser({
      email: adminEmail,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
    });
    
    log("Admin user created successfully: " + adminEmail, "admin");
  } catch (error) {
    log("Failed to create admin user: " + (error instanceof Error ? error.message : "Unknown error"), "admin");
  }
}

(async () => {
  await initStripe();
  await seedStripeProducts();
  await createAdminUser();
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
