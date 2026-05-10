# Holy Motion Assistive Monitor

PWA em Next.js para monitoramento assistivo usando o sensor BLE Holy-Motion.

Esta etapa cria apenas a estrutura inicial do projeto. Firebase e BLE real ainda
não foram implementados.

## Stack

- Next.js com App Router
- TypeScript
- Tailwind CSS
- ESLint

## Estrutura

```text
app/
components/
lib/
  ble/
  firebase/
  monitoring/
```

## Comandos

```bash
npm install
npm run dev
npm run lint
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local` quando for configurar integrações reais.

## Monitoramento remoto

O computador conectado ao sensor funciona como gateway:

```text
Holy-Motion -> Web Bluetooth -> /monitor -> Firestore -> /remote/holy-motion-001
```

Para ativar:

1. No Firebase, adicione um app Web ao projeto `Monitor Holi Motion`.
2. Copie o objeto de configuração para `.env.local` usando as variáveis
   `NEXT_PUBLIC_FIREBASE_*`.
3. Habilite o Firestore no console Firebase.
4. Rode o app e conecte o sensor em `/monitor`.
5. Acesse `/remote/holy-motion-001` em outro dispositivo.

Estrutura gravada no Firestore:

```text
devices/{deviceId}
devices/{deviceId}/telemetry/{sampleId}
devices/{deviceId}/alerts/{alertId}
```

Regras apenas para teste inicial:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /devices/{deviceId} {
      allow read, write: if true;

      match /{document=**} {
        allow read, write: if true;
      }
    }
  }
}
```

Antes de usar com dados reais, troque essas regras por autenticação ou token de
acesso.
