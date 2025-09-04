import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common'
import Stripe from 'stripe'
import { ApiQuery, ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../../services/prisma.service'

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private prisma: PrismaService) {}

  private getStripe() {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new HttpException('Stripe not configured', HttpStatus.NOT_IMPLEMENTED)
    return new Stripe(key, { apiVersion: '2024-06-20' })
  }

  @Post('checkout')
  async checkout(@Body() body: any) {
    const stripe = this.getStripe()
    const plan: 'starter' | 'pro' | 'team10' = body.plan || 'starter'
    const price = await this.ensurePrice(stripe, plan)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${process.env.APP_BASE_URL}/app/settings/billing?success=true`,
      cancel_url: `${process.env.APP_BASE_URL}/pricing?canceled=true`
    })
    return { url: session.url }
  }

  @Get('portal')
  @ApiQuery({ name: 'customerId', required: true })
  async portal(@Query('customerId') customerId: string) {
    const stripe = this.getStripe()
    const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${process.env.APP_BASE_URL}/app/settings/billing` })
    return { url: session.url }
  }

  private async ensurePrice(stripe: Stripe, plan: 'starter' | 'pro' | 'team10') {
    const pricing: Record<string, { name: string; unit_amount: number }> = {
      starter: { name: 'Starter', unit_amount: 29900 },
      pro: { name: 'Pro', unit_amount: 49900 },
      team10: { name: 'Team-10', unit_amount: 299000 }
    }
    const productName = `Inbox Genie ${pricing[plan].name}`
    const products = await stripe.products.list({ limit: 100 })
    let product = products.data.find((p) => p.name === productName)
    if (!product) product = await stripe.products.create({ name: productName })
    const prices = await stripe.prices.list({ product: product.id, active: true })
    let price = prices.data.find((pr) => pr.recurring?.interval === 'month' && pr.unit_amount === pricing[plan].unit_amount)
    if (!price) price = await stripe.prices.create({ product: product.id, currency: 'usd', unit_amount: pricing[plan].unit_amount, recurring: { interval: 'month' } })
    return price
  }
}

