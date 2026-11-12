# FightMatch

Aplicativo Expo/React Native para aproximar praticantes de luta, conversar e combinar treinos.

## Requisitos do projeto

- **CRUD de perfis:** edição e consulta de perfil. A tela de cadastro foi removida temporariamente.
- **CRUD de matches:** um match é criado quando dois usuários dão like um no outro; a lista permite bloquear ou desfazer o match.
- **Mapa de academias:** painel neutro do Distrito Federal com cinco pontos de academias fictícias e distâncias aproximadas; o usuário pode pedir a localização atual pelo Expo Location.
- **Autenticação e nuvem:** Firebase Authentication e Firestore permanecem nos serviços; a interface de login/cadastro está removida temporariamente.
- **Dados locais e sincronização:** SQLite guarda cache de perfis, likes pendentes e agendamentos. Criar, editar, confirmar e excluir agendamentos offline gera uma fila local; ela é enviada ao Firestore quando a conexão retorna.
- **APIs e serviços de localização:** ViaCEP consulta CEP e preenche cidade/estado; Expo Location solicita GPS em primeiro plano para calcular distâncias aproximadas até os pontos fictícios do mapa do DF.

No navegador, o projeto mantém o fallback existente em `localStorage`; o requisito SQLite é atendido no aplicativo Android/iOS.

O app abre sempre com o perfil fictício **Rafa Silva** e cinco lutadores de demonstração. Likes, matches, avaliações, edições do perfil e mensagens do chat demo ficam somente na memória da sessão; não são enviados ao Firebase e somem ao atualizar o app. No chat demo, só o usuário envia mensagens; não há respostas simuladas. A agenda de lutas foi substituída temporariamente pelo mapa demonstrativo do DF. As academias e posições do mapa são fictícias; localização GPS serve para calcular distâncias aproximadas até esses pontos, não para encontrar estabelecimentos reais. A interface de autenticação está desativada nesta versão.

## Configuração

1. Instale as dependências com `npm install`.
2. No PowerShell, crie o arquivo local: `Copy-Item .env.example .env`.
3. Crie um projeto no Firebase Console, adicione um app Web e copie os seis valores da configuração para o `.env`.
4. No Firebase Authentication, habilite o provedor **E-mail/senha**.
5. Crie o banco Firestore e publique as regras do arquivo `firestore.rules` pela área **Firestore Database > Regras** do Console.
6. Inicie o app com `npx expo start`.

As variáveis `EXPO_PUBLIC_FIREBASE_*` são incluídas no aplicativo compilado. Elas não são senhas; a proteção dos dados depende das regras do Firestore. Não coloque chaves privadas nesse arquivo.

## Demonstração

1. Na demonstração local, percorra os perfis e mostre que três já curtiram o perfil. Like recíproco cria match; deslike não cria.
2. Toque em **Recarregar sem match** para rever perfis sem match; os matches existentes permanecem na aba Matches.
3. Para voltar a demonstrar Firebase Authentication, CRUD remoto, agenda e sincronização SQLite/Firestore, configure `.env` e reative as telas e a observação de sessão; o perfil demo atual não grava na nuvem.

## Perguntas para revisar

- **Como funciona a sincronização?** O agendamento é salvo no SQLite junto com a operação pendente. Quando o NetInfo identifica conexão, o serviço processa a fila em ordem e remove cada pendência só depois da confirmação do Firestore.
- **Por que existe SQLite e Firestore?** SQLite mantém dados disponíveis no próprio aparelho sem rede; Firestore permite armazenar e consultar os dados na nuvem entre usuários e dispositivos.
- **Para que serve o ViaCEP?** Evita digitação manual de cidade e estado: a API recebe o CEP e devolve os dados de endereço usados no perfil.
- **Como funciona a localização?** O Expo Location solicita permissão em primeiro plano somente quando o usuário toca em GPS. Se não houver permissão, o mapa usa o Plano Piloto como referência.