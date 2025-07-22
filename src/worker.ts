import { Worker } from 'bullmq';
import IORedis from 'ioredis';
// const { xai } = require('@ai-sdk/xai');
import { xai } from '@ai-sdk/xai';

import { generateText, streamText } from 'ai';
import { prisma } from './prisma'; // adapte conforme seu path
import {
    systemPromptArminiana,
    systemPromptBatista,
    systemPromptPentecostal,
    systemPromptReformada,
} from '../lib/prompts/prompt';

const connection = new IORedis(process.env.URL_CONECTION_REDIS as string, {
    maxRetriesPerRequest: null,
});

// Redis Pub para eventos SSE
const pub = new IORedis(process.env.URL_CONECTION_REDIS as string, {
    maxRetriesPerRequest: null
});
const del = new IORedis(process.env.URL_CONECTION_REDIS as string, {
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
        console.log(stream.textStream)
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

        await del.del(`lock:${perguntaHash}`);
    },
    { connection }
);

worker.on('completed', job => {
    console.log(`[Worker] Job ${job.id} completo`);
});

worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} falhou`, err);
});
