import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './modules/app.module'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { RateLimitInterceptor } from './interceptors/rate-limit.interceptor'
import * as Sentry from '@sentry/node'
// import './tracing'

async function bootstrap() {
  const adapter = new FastifyAdapter({ 
    logger: false,
    bodyLimit: 10 * 1024 * 1024, // 10MB limit
    disableRequestLogging: true
  })
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter)
  
  // Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN })
  }
  
  // CORS - Parse allowed origins from CSV
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || 'http://localhost:3000'
  const allowedOrigins = allowedOriginsEnv.split(',').map(origin => origin.trim()).filter(Boolean)
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization', 
      'Stripe-Signature',
      'X-Twilio-Signature'
    ]
  })

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true }
  }))
  app.useGlobalInterceptors(app.get(RateLimitInterceptor))
  try {
    const config = new DocumentBuilder()
      .setTitle('Inbox Genie API')
      .setDescription('MVP API docs for Inbox Genie')
      .setVersion('1.0')
      .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api-docs', app, document)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Swagger init error (continuing without docs)', (err as any)?.message || err)
  }
  const port = Number(process.env.PORT || 3001)
  await app.listen(port, '0.0.0.0')
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`)
}

bootstrap()
