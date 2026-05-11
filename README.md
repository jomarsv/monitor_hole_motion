# Holy Motion Assistive Monitor

PWA em Next.js para monitoramento assistivo usando o sensor BLE Holy-Motion.

Esta etapa cria apenas a estrutura inicial do projeto. Firebase e BLE real ainda
não foram implementados.

## Stack

- Next.js com App Router
- TypeScript
- Tailwind CSS
- ESLint
- PWA com manifest e service worker proprio

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
4. Em Authentication > Sign-in method, habilite o provedor Anonymous.
5. Publique as regras de `firestore.rules` no Firestore.
6. Rode o app e conecte o sensor em `/monitor`.
7. Acesse `/remote/holy-motion-001` em outro dispositivo.

Estrutura gravada no Firestore:

```text
devices/{deviceId}
devices/{deviceId}/telemetry/{sampleId}
devices/{deviceId}/alerts/{alertId}
```

O documento `devices/{deviceId}` tambem guarda `settings`, incluindo a
calibracao de repouso (`settings.restingEuler`) usada pelo monitor para calcular
inclinacao relativa por dispositivo.

A rota `/history/{deviceId}` exibe o historico de alertas. A tela `/monitor`
executa limpeza automatica de telemetria antiga em lotes de ate 50 documentos,
mantendo por padrao os ultimos 7 dias de amostras em
`devices/{deviceId}/telemetry`.

O app tambem aprende um perfil estatistico por dispositivo em
`settings.behaviorProfile`. Esse perfil e atualizado somente quando a analise
esta normal e guarda medias/picos habituais de aceleracao, giro e inclinacao
para detectar movimento fora do padrao aprendido.

## Alertas no celular

A rota remota registra `/sw.js` como service worker e usa
`ServiceWorkerRegistration.showNotification()` quando o navegador permite. No
celular:

1. Acesse `/remote/holy-motion-001`.
2. Toque em `Ativar alertas no celular`.
3. Permita notificacoes no navegador.
4. Se o navegador oferecer, instale o app na tela inicial para melhorar a
   confiabilidade dos alertas.

Regras iniciais protegidas por Firebase Auth anonimo:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    match /devices/{deviceId} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn()
        && request.resource.data.deviceId == deviceId;
      allow delete: if false;

      match /telemetry/{sampleId} {
        allow read: if isSignedIn();
        allow create, update: if isSignedIn()
          && request.resource.data.deviceId == deviceId;
        allow delete: if isSignedIn()
          && resource.data.deviceId == deviceId;
      }

      match /alerts/{alertId} {
        allow read: if isSignedIn();
        allow create, update: if isSignedIn()
          && request.resource.data.deviceId == deviceId;
        allow delete: if false;
      }
    }
  }
}
```

Isso remove o acesso publico aberto. Para dados sensiveis, o proximo passo deve
ser restringir leitura/escrita por dispositivo com papeis por UID ou mover a
publicacao para uma API server-side com token privado.
