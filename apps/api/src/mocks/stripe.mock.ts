export class MockStripe {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  checkout = {
    sessions: {
      create: async (params: any) => {
        console.log('🎭 MOCK Stripe: Creating checkout session', {
          mode: params.mode,
          successUrl: params.success_url,
          cancelUrl: params.cancel_url,
          clientReferenceId: params.client_reference_id
        })

        return {
          id: `demo-checkout-${Date.now()}`,
          url: `${process.env.APP_BASE_URL}/demo/stripe-checkout?session_id=demo-checkout-${Date.now()}`,
          mode: params.mode,
          status: 'open',
          created: Math.floor(Date.now() / 1000),
          expires_at: Math.floor(Date.now() / 1000) + 86400 // 24 hours
        }
      }
    }
  }

  billingPortal = {
    sessions: {
      create: async (params: { customer: string; return_url: string }) => {
        console.log('🎭 MOCK Stripe: Creating billing portal session', {
          customer: params.customer,
          returnUrl: params.return_url
        })

        return {
          id: `demo-portal-${Date.now()}`,
          url: `${process.env.APP_BASE_URL}/demo/stripe-portal?session_id=demo-portal-${Date.now()}`,
          created: Math.floor(Date.now() / 1000),
          expires_at: Math.floor(Date.now() / 1000) + 86400,
          return_url: params.return_url
        }
      }
    }
  }

  products = {
    list: async () => ({
      data: [
        {
          id: 'demo-product-starter',
          name: 'Starter Plan (Demo)',
          active: true,
          created: Math.floor(Date.now() / 1000)
        }
      ]
    }),

    create: async (params: { name: string }) => {
      console.log('🎭 MOCK Stripe: Creating product', params)
      return {
        id: `demo-product-${Date.now()}`,
        name: params.name + ' (Demo)',
        active: true,
        created: Math.floor(Date.now() / 1000)
      }
    }
  }

  prices = {
    list: async (params: { product: string }) => ({
      data: [
        {
          id: `demo-price-${params.product}`,
          product: params.product,
          unit_amount: 2900,
          currency: 'usd',
          recurring: { interval: 'month' },
          active: true
        }
      ]
    }),

    create: async (params: any) => {
      console.log('🎭 MOCK Stripe: Creating price', params)
      return {
        id: `demo-price-${Date.now()}`,
        product: params.product,
        unit_amount: params.unit_amount,
        currency: params.currency,
        recurring: params.recurring,
        active: true
      }
    }
  }

  webhooks = {
    constructEvent: (payload: any, sig: string, secret: string) => {
      console.log('🎭 MOCK Stripe: Constructing webhook event from payload')
      
      return {
        id: `demo-evt-${Date.now()}`,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'demo-checkout-session',
            customer: 'demo-customer',
            subscription: 'demo-subscription',
            client_reference_id: 'demo-tenant',
            status: 'complete'
          }
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false
      }
    }
  }

  static create(apiKey?: string) {
    if (apiKey && apiKey.startsWith('sk_')) {
      // Use real Stripe if valid API key provided
      return import('stripe').then(({ default: Stripe }) => new Stripe(apiKey, { apiVersion: '2024-06-20' }))
    }
    
    // Return mock
    return Promise.resolve(new MockStripe('demo-key'))
  }
}