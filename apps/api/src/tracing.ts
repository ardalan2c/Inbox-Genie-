import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  // Lazy import heavy OTEL deps only if enabled
  (async () => {
    try {
      const otelNode: any = await import('@opentelemetry/sdk-node')
      const otlpHttp: any = await import('@opentelemetry/exporter-trace-otlp-http')
      const resources: any = await import('@opentelemetry/resources')
      const semconv: any = await import('@opentelemetry/semantic-conventions')
      diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)
      const exporter = new otlpHttp.OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT })
      const sdk = new otelNode.NodeSDK({
        traceExporter: exporter,
        resource: new resources.Resource({ [semconv.SemanticResourceAttributes.SERVICE_NAME]: 'inbox-genie-api' })
      })
      sdk.start()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('OTEL init error', err)
    }
  })()
}
