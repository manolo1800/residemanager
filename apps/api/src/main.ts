import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import fastifyHelmet from "@fastify/helmet";
import fastifyCors from "@fastify/cors";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { RequestContextInterceptor } from "./common/interceptors/request-context.interceptor";

async function bootstrap() {

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        transport:
          process.env.NODE_ENV !== "production"
            ? {
                target: "pino-pretty",
                options: {
                  colorize: true,
                  translateTime: "SYS:standard",
                  ignore: "pid,hostname",
                },
              }
            : undefined,
      },
    })
  );

  // Security headers & CORS
  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: false,
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global prefix, filters & interceptors
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new RequestContextInterceptor());


  // OpenAPI spec with Scalar UI
  const config = new DocumentBuilder()
    .setTitle("SGC API")
    .setDescription("Sistema de Gestión de Condominios y Residencias")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Mount Scalar API Reference via Fastify native route
  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.get("/api-json", (_req: any, reply: any) => {
    reply.send(document);
  });
  fastifyInstance.get("/docs", (_req: any, reply: any) => {
    reply.type("text/html").send(`
      <!doctype html>
      <html>
        <head>
          <title>SGC API Reference</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <script id="api-reference" type="application/json">
            ${JSON.stringify(document)}
          </script>
          <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        </body>
      </html>
    `);
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen(port, "0.0.0.0");
  console.log(`🚀 SGC API running on http://0.0.0.0:${port}/api`);
  console.log(`📚 SGC Scalar Docs available on http://0.0.0.0:${port}/docs`);
}

bootstrap();
