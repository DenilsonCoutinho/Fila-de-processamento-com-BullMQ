import { Worker } from 'bullmq';
import IORedis from 'ioredis';
const { xai } = require('@ai-sdk/xai');

import { generateText, streamText } from 'ai';
import { prisma } from './prisma'; // adapte conforme seu path
import {
    systemPromptArminiana,
    systemPromptBatista,
    systemPromptPentecostal,
    systemPromptReformada,
} from '../lib/prompts/prompt';

const connection = new IORedis("rediss://default:AWxAAAIjcDFjZjZkMzUwZDNiZTc0OGJhYTBjMDNiN2YzZmUyNjQyZnAxMA@desired-rhino-27712.upstash.io:6379", {
    maxRetriesPerRequest: null,
});

// Redis Pub para eventos SSE
const pub = new IORedis("rediss://default:AWxAAAIjcDFjZjZkMzUwZDNiZTc0OGJhYTBjMDNiN2YzZmUyNjQyZnAxMA@desired-rhino-27712.upstash.io:6379", {
    maxRetriesPerRequest: null
});

const worker = new Worker(
    'ask-ai',
    async job => {
        const { messageUser, type_theology, userId, perguntaHash } = job.data;

        const systemPrompt =
            type_theology === 'BATISTA'
                ? systemPromptBatista
                : type_theology === 'ARMINIANA'
                    ? systemPromptArminiana
                    : type_theology === 'PENTECOSTAL'
                        ? systemPromptPentecostal
                        : systemPromptReformada;


        const stream = await streamText({
            model: xai("grok-3-beta"),
            system: systemPrompt,
            prompt: messageUser,
            temperature: 0,
        });

        let fullResponse = ''
        for await (const delta of stream.textStream) {
            if (!delta) continue;

            fullResponse += delta;

            // Envia cada pedaço para o cliente via Redis
            await pub.publish(`resposta:${perguntaHash}`, delta);
        }
        // Salva no banco
        await prisma.sharedResponse.update({
            where: { perguntaHash },
            data: {
                status: "done",
                htmlContent: fullResponse,
            },
        });

        // Publica para o frontend via canal SSE
        // await pub.publish(`resposta:${perguntaHash}`, JSON.stringify({
        //     htmlContent: fullResponse,
        //     teologia: type_theology,
        //     perguntaHash,
        // }));
    },
    { connection }
);

worker.on('completed', job => {
    console.log(`[Worker] Job ${job.id} completo`);
});

worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} falhou`, err);
});
