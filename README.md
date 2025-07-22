## ⚙️ Backend para processamento em fila
<h1>Este projeto foi feito apenas para fins de estudo e escala do projeto Teolog-IA que está destacado nos Pins do meu perfil!</h1>
Este projeto conta com um backend desacoplado, preparado para escalar, responsável por processar tarefas assíncronas da aplicação principal (como geração de respostas com IA).

### 🧠 Tecnologias principais:

- **Express** – Servidor leve e modular em Node.js
- **Prisma** – ORM para banco de dados relacional ou MongoDB
- **BullMQ** – Gerenciamento de filas assíncronas com Redis
- **ioredis / Upstash Redis** – Cache e filas serverless
- **OpenAI SDK + AI SDK da Vercel** – Geração de texto com IA
- **TypeScript** – Código tipado e moderno
- **Fly.io** – Deploy leve e escalável via Dockerfile
