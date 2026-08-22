# LariMailer — Frontend

Interface web do LariMailer, criada em React para organizar destinatários, receber conteúdo HTML ou pacotes ZIP e enviar as solicitações para a API.

## Funcionalidades

- dois campos opcionais de destinatário, exigindo pelo menos um preenchido;
- persistência local dos endereços no navegador;
- upload de arquivos `.html` e `.zip`;
- leitura e edição do conteúdo de um arquivo HTML;
- opção de colar o HTML diretamente;
- envio JSON para HTML simples;
- envio multipart para pacotes ZIP;
- feedback visual de validação, sucesso e erro;
- layout responsivo e cursor personalizado em dispositivos com ponteiro preciso.

## Tecnologias

- React 19
- Vite
- JavaScript e JSX
- Lucide React
- SweetAlert2
- CSS
- Oxlint

## Configuração

Instale as dependências e crie o arquivo local de ambiente:

```bash
npm install
cp .env.example .env
```

Defina a variável obrigatória:

| Variável | Descrição |
| --- | --- |
| `VITE_API_URL` | Endereço da API consumida pelo frontend |

Variáveis prefixadas com `VITE_` são incluídas no bundle do navegador e não devem armazenar informações sigilosas.

## Desenvolvimento

Inicie o servidor do frontend:

```bash
npm run dev
```

O backend deve estar em execução e acessível pela URL configurada em `VITE_API_URL`.

## Fluxos de envio

### HTML simples

Ao carregar um `.html` ou colar o código no campo de texto, a interface envia para `POST /api/send-email` um payload JSON com:

- `to`: lista dos endereços preenchidos;
- `subject`: assunto gerado com data e hora locais;
- `htmlBody`: conteúdo HTML informado.

### Pacote ZIP

Ao selecionar um `.zip`, a interface envia `to`, `subject` e `file` como `multipart/form-data`. O navegador define o boundary automaticamente; não configure manualmente o cabeçalho `Content-Type` nesse fluxo.

O ZIP deve conter um HTML principal e apenas imagens compatíveis referenciadas por ele. Consulte as [regras completas de pacotes ZIP](../backend/README.md#pacotes-zip).

## Scripts

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | inicia o Vite em modo de desenvolvimento |
| `npm run lint` | verifica o código com Oxlint |
| `npm run build` | gera o bundle de produção em `dist/` |
| `npm run preview` | serve localmente o bundle já gerado |

Antes de publicar alterações:

```bash
npm run lint
npm run build
```

## Estrutura principal

```text
frontend/
├── public/          # imagens, ícones e cursor temático
├── src/
│   ├── App.jsx      # formulário e integração com a API
│   ├── App.css      # componentes e identidade visual
│   ├── index.css    # estilos globais
│   └── main.jsx     # entrada da aplicação React
├── .env.example
├── index.html
└── vite.config.js
```

## Deploy

Na Vercel ou em outro serviço de hospedagem estática:

1. use `frontend/` como diretório raiz;
2. cadastre `VITE_API_URL` com a URL pública do backend;
3. execute o build de produção;
4. valide os dois fluxos de envio contra a API publicada.

Como `VITE_API_URL` é incorporada durante o build, uma mudança no valor exige uma nova publicação do frontend.

Os endereços informados ficam no `localStorage` do próprio navegador para facilitar novos envios. Em dispositivos compartilhados, limpe os campos e os dados do site quando essa persistência não for desejada.
