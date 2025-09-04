import NextAuth from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './server/db'
import nodemailer from 'nodemailer'

async function createTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  }
  // Dev ethereal account
  const test = await nodemailer.createTestAccount()
  const t = nodemailer.createTransport({ host: 'smtp.ethereal.email', port: 587, auth: { user: test.user, pass: test.pass } })
  return t
}

const providers: any[] = []
if (process.env.DISABLE_EMAIL_SIGNIN !== 'true') {
  providers.push(EmailProvider({
    async sendVerificationRequest({ identifier, url }) {
      const transport = await createTransport()
      const info = await transport.sendMail({
        to: identifier,
        from: process.env.EMAIL_FROM || 'Inbox Genie <no-reply@inboxgenie.dev>',
        subject: 'Your sign-in link',
        text: `Sign in to Inbox Genie: ${url}`
      })
      if (nodemailer.getTestMessageUrl(info)) {
        // eslint-disable-next-line no-console
        console.log('Magic link (ethereal):', nodemailer.getTestMessageUrl(info))
      }
    }
  }))
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut
} = NextAuth({
  session: { strategy: 'jwt' },
  adapter: PrismaAdapter(prisma) as any,
  providers
})
