# LariMailer

LariMailer é uma aplicação web para envio de e-mails em HTML. A interface permite colar o conteúdo, carregar um arquivo `.html` ou enviar um pacote `.zip` contendo o HTML e suas imagens.

O projeto mantém dois fluxos compatíveis:

- **HTML simples:** o conteúdo é enviado como JSON. Imagens em Data URL podem ser incorporadas pelo Nodemailer.
- **Pacote ZIP:** o arquivo é enviado como multipart; o backend encontra o HTML principal, valida o pacote e transforma imagens locais em anexos inline com CID.

## Tecnologias

### Frontend

- React 19 e Vite
- JavaScript/JSX
- Lucide React
- SweetAlert2
- Oxlint

### Backend

- Node.js, TypeScript e Fastify
- Nodemailer
- JSZip
- Vitest

## Estrutura

```text
larimailer/
├── frontend/   # Interface web e envio dos formulários
└── backend/    # API, validação dos pacotes e integração SMTP
```

Consulte também a documentação específica de cada aplicação:

- [Frontend](./frontend/README.md)
- [Backend](./backend/README.md)

## Pré-requisitos

- Node.js compatível com as dependências do projeto (recomenda-se uma versão LTS atual)
- npm
- Uma conta SMTP configurada para envio de e-mails

## Como executar localmente

O frontend e o backend são aplicações independentes. Abra um terminal para cada uma.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Preencha todas as variáveis do arquivo `backend/.env` antes de iniciar a API:

| Variável | Descrição |
| --- | --- |
| `INFRA_PORT` | Porta utilizada pela API |
| `INFRA_HOST` | Host utilizado pela API |
| `EMAIL_HOST` | Host do serviço SMTP |
| `EMAIL_PORT` | Porta do serviço SMTP |
| `EMAIL_USER` | Identificação da conta SMTP remetente |
| `EMAIL_PASSWORD` | Credencial de autenticação da conta SMTP |

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Defina `VITE_API_URL` em `frontend/.env`. Essa variável identifica o endereço do backend consumido pela interface.

## Como usar

1. Informe pelo menos um endereço de destino.
2. Escolha uma das opções:
   - carregue um arquivo `.html`;
   - cole o conteúdo HTML no campo de texto; ou
   - carregue um `.zip` com o HTML e as imagens locais.
3. Acione o botão de envio.

Para mensagens com muitas imagens, prefira o pacote ZIP. Isso evita aumentar o corpo JSON com conteúdo Base64.

Um pacote básico pode ter esta estrutura:

```text
email.zip
├── index.html
└── images/
    ├── banner.jpg
    └── logo.png
```

As referências no HTML devem apontar para os arquivos do próprio pacote, por exemplo `images/banner.jpg`. Regras e limites completos estão no [README do backend](./backend/README.md#pacotes-zip).

## Verificação

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

### Backend

```bash
cd backend
npm test
npm run build
```

## Deploy

As duas aplicações podem ser publicadas separadamente na Vercel, usando `frontend/` e `backend/` como diretórios raiz dos respectivos projetos.

- Cadastre todas as variáveis SMTP e de infraestrutura no projeto do backend.
- Cadastre `VITE_API_URL` no projeto do frontend com a URL pública da API.
- Não publique arquivos `.env` nem credenciais no GitHub.

O sucesso dos testes locais confirma o comportamento da aplicação com os adaptadores testados, mas o envio real ainda depende da aceitação das credenciais, das políticas e dos limites do provedor SMTP.
