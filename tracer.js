const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { FastifyInstrumentation } = require('@opentelemetry/instrumentation-fastify');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { DnsInstrumentation } = require('@opentelemetry/instrumentation-dns');
const {
  SimpleSpanProcessor,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
  ConsoleSpanExporter,
} = require('@opentelemetry/sdk-trace-base');

const tracerProvider = new NodeTracerProvider({
  sampler: new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(1),
  }),
});

registerInstrumentations({
  tracerProvider,
  instrumentations: [
    new HttpInstrumentation(),
    new DnsInstrumentation(),
    new FastifyInstrumentation(),
  ],
});

tracerProvider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

tracerProvider.register();
