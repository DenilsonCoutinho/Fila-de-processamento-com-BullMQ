import { Queue } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis("rediss://default:AWxAAAIjcDFjZjZkMzUwZDNiZTc0OGJhYTBjMDNiN2YzZmUyNjQyZnAxMA@desired-rhino-27712.upstash.io:6379"); // ou upstash
export const aiQueue = new Queue('ask-ai', { connection });
export const responseQueue = new Queue("response-queue", {
  connection,
});

export async function addJobToQueue(data: {
  userId: string;
  messageUser: string;
  type_theology: string;
}) {
  await aiQueue.add('process-response', data, {
    attempts: 3,
  });
}