export type PlanKey = 'starter' | 'pro' | 'team10';

export type Plan = {
  key: PlanKey;
  name: string;
  priceMonthly: number;
  minutes: number;
  sms: number;
  calendars: number | 'multi';
  crms: number | 'multi';
  features: string[];
};

export const PLANS: Plan[] = [
  {
    key: 'starter',
    name: 'Starter',
    priceMonthly: 299,
    minutes: 500,
    sms: 1000,
    calendars: 1,
    crms: 1,
    features: ['Transparent minutes. No setup fees.']
  },
  {
    key: 'pro',
    name: 'Pro',
    priceMonthly: 499,
    minutes: 1000,
    sms: 3000,
    calendars: 'multi',
    crms: 'multi',
    features: ['Deposits', 'Custom voice']
  },
  {
    key: 'team10',
    name: 'Team-10',
    priceMonthly: 2990,
    minutes: 8000,
    sms: 20000,
    calendars: 'multi',
    crms: 'multi',
    features: ['White-label']
  }
];

export const OVERAGE = { perMinute: 0.12 };

