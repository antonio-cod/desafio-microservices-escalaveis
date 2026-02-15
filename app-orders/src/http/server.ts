import "@opentelemetry/auto-instrumentations-node/register";
import { trace } from "@opentelemetry/api";

import { fastifyCors } from "@fastify/cors";
import { custom, z } from "zod";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { fastify } from "fastify";
import { channels } from "../broker/channels/index.ts";
import { randomUUID } from "node:crypto";
import { db } from "../db/client.ts";
import { schema } from "../db/schema/index.ts";
import { dispatchOredrCreated } from "../broker/messages/oder-created.ts";
import { setTimeout } from "node:timers/promises";
import { tracer } from "../tracer/tracer.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifyCors, {
  origin: "*",
});

app.get("/health", () => {
  return "OK";
});

app.post(
  "/orders",
  {
    schema: {
      body: z.object({
        amount: z.coerce.number(),
      }),
    },
  },
  async (request, reply) => {
    const { amount } = request.body;

    console.log("New order received. Amount:", amount);

    const orderId = randomUUID();

    await db.insert(schema.orders).values({
      id: randomUUID(),
      customerId: "sfafas-454-sfasf",
      amount,
    });

    const span = tracer.startSpan("eu acho que aqui ta dando merda");

    span.setAttribute("teste", "Hello World");

    await setTimeout(2000);

    span.end();

    dispatchOredrCreated({
      orderId,
      amount,
      customer: {
        id: "sfafas-454-sfasf",
      },
    });

    // channels.orders.sendToQueue(
    //   "orders",
    //   Buffer.from(JSON.stringify({ amount })),
    // );

    return reply.status(201).send();
  },
);

app
  .listen({
    host: "0.0.0.0",
    port: 3333,
  })
  .then(() => {
    console.log("[Orders] HTTP server running!");
  });
