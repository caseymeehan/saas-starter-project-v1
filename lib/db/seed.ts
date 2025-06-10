import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users, teams, teamMembers } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.log('Stripe products and prices created successfully.');
}

import { eq } from 'drizzle-orm';

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

    let user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        role: "owner",
      },
    ])
    .returning();
    console.log('Initial user created.');
  } else {
    console.log('User test@test.com already exists.');
  }

  // Ensure user is not undefined before proceeding
  if (!user) {
    console.error('Failed to create or find user.');
    process.exit(1);
  }

  let team = await db.query.teams.findFirst({
    where: eq(teams.name, 'Test Team'),
  });

  if (!team) {
    [team] = await db
    .insert(teams)
    .values({
      name: 'Test Team',
    })
    .returning();
    console.log('Test Team created.');
  } else {
    console.log('Test Team already exists.');
  }

  // Ensure team is not undefined before proceeding
  if (!team) {
    console.error('Failed to create or find team.');
    process.exit(1);
  }

  // Check if team member already exists
  const existingTeamMember = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id) && eq(teamMembers.teamId, team.id),
  });

  if (!existingTeamMember) {
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: user.id,
      role: 'owner',
    });
    console.log('Team member created.');
  } else {
    console.log('Team member already exists.');
  }

  await createStripeProducts();
}

// The original user creation block will be replaced by the logic above.
// We need to ensure the original block is removed or commented out.
// For this tool, we are replacing the start of the seed function and inserting the new logic.
// The original user creation code was:
/*
  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        role: "owner",
      },
    ])
    .returning();

  console.log('Initial user created.');

  const [team] = await db
    .insert(teams)
    .values({
      name: 'Test Team',
    })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: user.id,
    role: 'owner',
  });

  await createStripeProducts();
}
*/
// The replacement content for the next chunk will effectively remove the old logic
// by replacing it with a comment or an empty string if the tool requires content.



seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
