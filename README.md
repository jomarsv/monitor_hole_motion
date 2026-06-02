# CortexMA - Maranhao Estrategico IA

Plataforma de inteligencia artificial estrategica para analise de desafios, oportunidades e cenarios de desenvolvimento do Estado do Maranhao.

O sistema agora opera com:

- login por usuario e senha
- hierarquia por perfil
- biblioteca privada de arquivos para suporte da IA
- limite diario de analises por usuario
- persistencia server-side no Firestore e Google Cloud Storage

## Tecnologias

- Next.js com App Router
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Admin SDK
- OpenAI API via server-side route
- Deploy na Vercel

## Rotas principais

- `/` - pagina inicial
- `/entrar` - login e bootstrap do primeiro administrador
- `/nova-analise` - nova analise estrategica
- `/analises` - historico autenticado
- `/biblioteca` - biblioteca privada
- `/usuarios` - gestao de usuarios

## Hierarquia

Os perfis seguem esta ordem de acesso:

- `admin`
- `manager`
- `analyst`
- `viewer`

O nivel numerico (`accessLevel`) controla:

- quais arquivos da biblioteca o usuario pode consultar
- quais arquivos ele pode cadastrar
- quanto a IA pode usar do conhecimento privado no contexto da resposta
- o limite diario de analises por conta

## Variaveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.2
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
CORTEXMA_BOOTSTRAP_SECRET=
```

Observacoes:

- `OPENAI_API_KEY` nunca deve ir para o frontend.
- `FIREBASE_ADMIN_PRIVATE_KEY` deve preservar as quebras de linha. Na Vercel, armazene com `\n`.
- `CORTEXMA_BOOTSTRAP_SECRET` e a chave usada para criar o primeiro administrador.

## Fluxo de acesso

1. O usuario faz login em `/entrar`.
2. As rotas server-side validam o ID token do Firebase.
3. O perfil salvo em `/users/{uid}` define role, nivel e limite diario.
4. A analise consome a cota diaria antes de chamar a OpenAI.
5. A biblioteca privada e consultada no servidor com base no nivel de acesso do usuario.
6. Os arquivos sobem para Google Cloud Storage e a metadados ficam no Firestore.

## Firestore

O projeto usa Firestore apenas via servidor e Firebase Admin.

As regras atuais bloqueiam acesso direto do navegador. Isso e intencional:

- analises sao gravadas por rota server-side
- usuarios sao gerenciados por rota server-side
- biblioteca e servida por rota server-side com URLs assinadas

## Firebase

1. Crie ou use o projeto Firebase `cortexma`.
2. Ative Authentication, Firestore e Storage.
3. Configure as credenciais admin no ambiente local e na Vercel.
4. Publique `firestore.rules`.
5. Crie o primeiro administrador em `/entrar` usando a chave de bootstrap.

## Rodar localmente

```bash
npm install
npm run dev
```

## Verificacao

```bash
npm run lint
npm run typecheck
npm run build
```

## Deploy na Vercel

1. Publique o projeto no GitHub.
2. Importe o repositório na Vercel.
3. Configure o diretório raiz como `cortexma`.
4. Adicione as variaveis de ambiente.
5. Execute o deploy.

O usuario final deve acessar o CortexMA pelo link gerado pela Vercel.
