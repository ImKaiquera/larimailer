# LariMailer — Backend

API responsável por validar as solicitações do LariMailer, preparar mensagens HTML e enviá-las por SMTP. O serviço aceita tanto o payload JSON original quanto pacotes ZIP com imagens locais.

## Responsabilidades

- expor a verificação de saúde da aplicação;
- validar destinatários, assunto e corpo HTML;
- processar e proteger a entrada de pacotes ZIP;
- converter referências de imagens locais em anexos inline com CID;
- enviar as mensagens por SMTP usando Nodemailer.

## Arquitetura

O código mantém as responsabilidades separadas em camadas:

```text
src/
├── index.ts                         # composição da aplicação e rotas
├── infra/
│   ├── adapters/archive/            # leitura e validação de ZIP
│   ├── adapters/email/              # integração com Nodemailer
│   └── config/                      # validação do ambiente
└── modules/emails/
    ├── application/                 # casos de uso, interfaces e erros
    ├── domain/                      # entidade de e-mail
    └── presentation/                # controller HTTP
```

## Configuração

Instale as dependências e crie o arquivo local de ambiente:

```bash
npm install
cp .env.example .env
```

Todas as variáveis abaixo são obrigatórias e representam a configuração de infraestrutura e do serviço de e-mail.

| Variável | Descrição |
| --- | --- |
| `INFRA_PORT` | Porta utilizada pela API |
| `INFRA_HOST` | Host utilizado pela API |
| `EMAIL_HOST` | Host do serviço SMTP |
| `EMAIL_PORT` | Porta do serviço SMTP |
| `EMAIL_USER` | Identificação da conta SMTP remetente |
| `EMAIL_PASSWORD` | Credencial de autenticação da conta SMTP |

Em ambientes Vercel, a plataforma define `VERCEL` automaticamente. As demais variáveis continuam obrigatórias e devem ser cadastradas nas configurações do projeto.

## Scripts

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | inicia a API em modo de desenvolvimento com recarga automática |
| `npm test` | executa os testes com Vitest |
| `npm run build` | compila o TypeScript para `dist/` |

Para iniciar o desenvolvimento:

```bash
npm run dev
```

## API

### `GET /health`

Retorna `200 OK` quando a aplicação está disponível:

```json
{
  "message": "UP!"
}
```

### `POST /api/send-email`

#### HTML via JSON

Use `Content-Type: application/json`:

```json
{
  "to": ["recipient@example.com"],
  "subject": "Assunto do e-mail",
  "htmlBody": "<p>Conteúdo do e-mail</p>"
}
```

| Campo | Tipo | Regra |
| --- | --- | --- |
| `to` | `string[]` | deve conter pelo menos um e-mail válido |
| `subject` | `string` | obrigatório e não vazio |
| `htmlBody` | `string` | obrigatório e não vazio |

O Nodemailer é configurado com `attachDataUrls`, portanto imagens incorporadas como Data URL no HTML podem ser convertidas em anexos.

#### Pacote ZIP via multipart

Use `Content-Type: multipart/form-data` com estes campos:

| Campo | Tipo | Regra |
| --- | --- | --- |
| `to` | texto | array JSON de destinatários |
| `subject` | texto | assunto da mensagem |
| `file` | arquivo | um único arquivo com extensão `.zip` |

Resposta de sucesso para os dois formatos:

```json
{
  "message": "E-mail disparado com sucesso"
}
```

Falhas de entrada retornam uma resposta com `error` e `message`. Requisições que ultrapassam os limites aplicáveis retornam status `413`.

## Pacotes ZIP

Para um pacote com imagens, prefira um `index.html` na raiz:

```text
email.zip
├── index.html
└── images/
    ├── banner.jpg
    └── detalhe.png
```

O backend reconhece referências locais nos atributos `src` e `background`, além de `url(...)` em CSS. URLs HTTP/HTTPS, Data URLs, CIDs, links de e-mail e telefone e âncoras são mantidos como estão.

### Seleção do HTML principal

A ordem de seleção é:

1. `index.html` na raiz;
2. o único arquivo HTML do pacote;
3. o único `index.html` encontrado em uma subpasta.

Se não houver HTML, ou se existirem vários HTMLs sem um principal inequívoco, o pacote é rejeitado.

### Formatos e limites

| Regra | Limite |
| --- | --- |
| tamanho do ZIP enviado | 4 MB |
| conteúdo total descompactado | 25 MB |
| arquivo HTML | 2 MB |
| imagem individual | 8 MB |
| quantidade de arquivos | 100 |
| extensões aceitas | `.html`, `.gif`, `.jpeg`, `.jpg`, `.png` |

Arquivos de sistema do macOS (`__MACOSX` e `.DS_Store`) são ignorados. O processamento também rejeita caminhos absolutos, travessia de diretórios, formatos não permitidos, referências que escapem do pacote e imagens locais ausentes.

## Testes e build

As variáveis de ambiente também precisam estar disponíveis ao executar testes que carregam a aplicação.

```bash
npm test
npm run build
```

Os testes ficam próximos ao código como arquivos `*.spec.ts` e cobrem as fronteiras HTTP, o processamento de ZIP e o adaptador de e-mail.

## Deploy na Vercel

O arquivo `vercel.json` direciona as rotas para `src/index.ts` usando a função Node da Vercel. Ao criar o projeto:

1. use `backend/` como diretório raiz;
2. cadastre todas as variáveis obrigatórias no ambiente da Vercel;
3. publique e valide `GET /health`;
4. faça um envio controlado para confirmar a autenticação e a aceitação do provedor SMTP.

Não registre credenciais, conteúdo sensível de mensagens ou valores reais de ambiente no código, em testes ou em logs.
