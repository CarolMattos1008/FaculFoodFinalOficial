# FaculFood v11

App de **pedidos para retirada no balcão** dos restaurantes do campus da PUC-Rio.
LIA Impact Lab — Applied AI League · **Caso 4: Restaurantes integrados** (cardápios, preços e pedidos num só lugar).

> O Caso 4 não tem dado pronto no repositório oficial: parte do desafio era construí-lo. A base foi montada a partir das
> fotos dos cardápios de 5 restaurantes reais do campus e está exportada em [`data/cardapios.json`](data/cardapios.json).
> Nenhuma fonte externa de dados foi usada.

## Rodar em 1 minuto

É um site estático: um `index.html` sem build, sem servidor e sem dependências externas.

| Onde | Como |
|---|---|
| **No ar (GitHub Pages)** | Fork/push deste repositório → *Settings → Pages* → branch `main`, pasta `/ (root)`. Abra `https://<usuario>.github.io/<repo>/`. |
| **Local** | Dois cliques no `index.html`. Para testar o “instalar app” e o modo offline, sirva por HTTP: `python3 -m http.server 8000` e abra `http://localhost:8000`. |
| **No celular** | Abra o link do Pages → menu do navegador → **Adicionar à tela inicial**. Abre em tela cheia, como app. |

**Reproduzir do zero:** clone o repositório e siga uma das linhas acima. Não há passo de instalação.
Para zerar os dados, apague as chaves `faculfood_v8*` do `localStorage` (DevTools → Application).

### Contas de demonstração

Na tela de login, escolha **Cliente**, **Restaurante** ou **Gestor** e digite um dos acessos abaixo (o app não mostra mais atalho de demonstração).
Também dá para **criar conta** nos três perfis.

| Perfil | E-mail | Senha |
|---|---|---|
| Cliente | `demo@puc-rio.br` | `demo1234` |
| Restaurante — Soba Sushi | `sobasushi@gmail.com` | `sobasushi123` |
| Restaurante — Na Medida | `namedida@gmail.com` | `namedida123` |
| Restaurante — Cardeal | `cardeallanches@gmail.com` | `cardeallanches123` |
| Restaurante — Vai um Strogonoff | `strogonoff@gmail.com` | `strogonoff123` |
| Restaurante — Açaí do Wall | `acaidowall@gmail.com` | `acaidowall123` |
| Afiliado pendente (exemplo) | `tapiocagavea@exemplo.com` | `tapioca123` |
| **Gestor (PUC-Rio)** | `gestor@puc-rio.br` | `gestor2026` |

**Teste de dois lados no mesmo computador:** abra o app em duas abas (cada aba guarda a própria sessão; os dados são compartilhados).
Aba 1 = cliente faz o pedido e marca “Avisar no WhatsApp quando ficar pronto”. Aba 2 = restaurante vê o pedido no quadro, arrasta até **Pronto**:
o WhatsApp abre com a mensagem para o cliente e a aba 1 toca o alarme.

## Novidades da v11

- **Entrada padrão:** abrir o app (ou recarregar a página) sempre mostra a tela de **entrar ou criar conta**. O aparelho não guarda mais o login entre aberturas.
- **Só 3 filtros** abaixo de “O que comer agora?”, sempre em **uma linha**: os 3 itens mais pedidos no campus, contados nos pedidos (sem pedidos, vale a ordem padrão).

## Novidades da v10

- **Gestor com as bases:** abas **Restaurantes** (todos os restaurantes, filtro pendente/aprovado/suspenso, busca, aprovar/recusar/suspender, exportar CSV)
  e **Clientes** (base de clientes com pedidos, gasto e última compra, exportar CSV; dados pessoais tratados conforme a LGPD).
  Abas do gestor: Engajamento · Restaurantes · Clientes · Infraestrutura · Registro. A avaliação do app (NPS) passou para dentro de Engajamento.
- **Alarme como opção:** no Perfil, a caixa **“Tocar quando o pedido ficar pronto”** vem marcada; desmarcada, o cliente recebe só o aviso discreto. Saiu o botão “Testar”.
- **“O que comer agora?”**: a pergunta da tela inicial ficou mais curta e cabe em uma linha em qualquer tela (celular de 320 px ao computador).
- **Apresentações** em `apresentacoes/`: `FaculFood-Sprint.pptx` (15 slides, no formato do modelo da turma, sem sequenciador e sem pesquisa de usuário) e `FaculFood-Pitch-30s.pptx` (pitch de 30 s com roteiro nas notas).
- **Pedido → loja → cliente na vida real:** testado com o cliente numa aba e a loja em outra. A loja toca “Preparar” e o cliente vê **Em preparo** (amarelo) em Acompanhar;
  a loja toca “Pronto” e o cliente vê **Pronto** (verde) e o alarme. **Em celulares diferentes ainda não sincroniza**: os dados ficam no navegador.
  Para o piloto é preciso o back-end do `blueprint-n8n.md` (Supabase com tempo real).

## Novidades da v9

- **“Cancelar conta”** no lugar de “Apagar minha conta”, com botão neutro (sem vermelho) e confirmação em dois toques.
- **Perfil do cliente mais limpo:** saiu o bloco “Avançado” (chave da API do Claude e modelo). A chave continua disponível só para o restaurante, em Loja, para a leitura do cardápio por foto.
- **Imagem dos restaurantes:** cada restaurante pode enviar a **foto da loja** (logo ou fachada) em Loja; ela aparece na lista e como capa do cardápio.
  Sem foto, o app mostra o ícone da culinária sobre a cor do tipo de comida (japonês, café, saudável, açaí, pratos, hambúrguer, salgados).

## Novidades da v8

- **Sem atalho “Usar conta de demonstração”** nos três perfis.
- **Criar conta nos três perfis:** cliente (e-mail e senha), restaurante (“Criar conta · seja um restaurante afiliado”) e **gestor** (e-mail institucional `@puc-rio.br`).
  Depois do cadastro cada um navega nas próprias abas.
- **Seja um restaurante afiliado = interesse para análise do gestor:** nome, e-mail, senha e nº de cadastro na PUC (mais dados opcionais).
  Sem cardápio nessa etapa; o restaurante monta os itens depois, em **Itens à venda** (estoque, desconto, foto do item e leitura do cardápio por foto),
  e só aparece para os alunos quando o gestor aprova em **Afiliações**.
- **Pagamento corrigido:** ao tocar “Já paguei”, o pedido fica **Pago ✓** e é **confirmado na hora** (vai para “Na fila”). Cartão também confirma direto.
  A loja pode marcar “Não recebi” se o Pix não cair.
- **Pedido só em Acompanhar:** a faixa flutuante saiu da busca e da home; a aba Acompanhar mostra um contador.
- **Gestor:** aba **Infraestrutura** com área ocupada (m²), balcões, vendas por m², pico do balcão × capacidade e armazenamento usado pelo app;
  área e balcões são editáveis (os valores iniciais são de exemplo).

## Novidades da v7

- **Roteiro do cliente:** login ou cadastro → entra direto em **“O que comer agora?”**. O filtro **“O que você gosta?”** é opcional
  (botão ao lado de “Indicado pra você” e no Perfil) e não aparece mais como segunda tela.
- **Sem histórico de pedidos para o cliente:** ele vê só o pedido em andamento e o que falta avaliar; o histórico fica apenas no algoritmo de indicação.
- **Perfil:** WhatsApp, alarme e gosto em cima; **Avaliar o app** e **Apagar minha conta** no final.
- **Visual mais sóbrio:** emojis trocados por ícones de linha, monogramas nos restaurantes e **fotos reais dos itens** (o restaurante tira a foto pelo celular).
- **Restaurante entra na tela “Itens à venda”:** controle do estoque oferecido (− / + / +10 / digitar), liga e desliga a venda, **desconto** por item,
  resumo (à venda, estoque oferecido, acabando, esgotados).
- **Ler cardápio por foto:** tira a foto do cardápio → o app lê títulos, subtítulos, preços e categorias → o restaurante confere e publica.
  Usa o Claude (se a chave estiver em Loja) ou OCR gratuito no navegador (Tesseract.js, precisa de internet).
- **Pedidos do restaurante no mesmo quadro do cliente** (Não confirmado · Na fila · Em preparo · Pronto) + “Retirados hoje”.
- **Gestor:** restaurantes mais engajados **por vendas**, **por avaliação dos alunos** ou geral. Login aceita `gestor` ou `gestor@puc-rio.br`.

## Novidades da v6

- **Status com cores**, iguais para cliente e restaurante: ⚪ cinza **não confirmado** · 🔴 vermelho **na fila** · 🟡 amarelo **em preparo** · 🟢 verde **pronto**.
  A loja confirma o pedido (vai para a fila), começa a preparar e marca pronto; o cliente acompanha no quadro **Acompanhar**.
- **Pagamento claro:** depois do Pix aparece “Já paguei” no próprio cartão do pedido → “Pix enviado · loja confirmando” → **“Pago ✓”** quando a loja confirma.
- **Alarme de pedido pronto em tela cheia** (sino, código grande, som repetido, vibração e notificação) + aviso no WhatsApp. Botão “Testar” no Perfil.
- **Sempre dá para saber onde você está:** selo **Cliente / Restaurante / Gestor** no topo, com a cor do perfil, e menu com Meu perfil, Entrar como outro perfil e Sair.
- **Busca sem histórico:** “O que comer agora?” mostra só o que está sendo digitado e o resultado.
- **Pedido em andamento fora do caminho:** saiu de baixo da busca e virou uma pílula flutuante (com a cor do status) acima das abas.
- **Converse com o estabelecimento** (aba Conversar do cliente).
- **Afiliado:** cadastro com nome, **e-mail, senha criada pelo restaurante e número de cadastro na PUC**; itens com título e subtítulo; o resto é opcional.
- **Questionário de gostos logo após o cadastro** (com “Pular”), e também no fim do Perfil.
- **Aba Resultados do restaurante:** itens mais pedidos, horário de pico dos clientes, faturamento, ticket médio e avaliações — por 7 dias, 30 dias ou tudo.
  A base traz pedidos de demonstração dos últimos 14 dias para os gráficos não começarem vazios.
- **Avaliação depois do pedido:** estrelas para o **restaurante** e para o **pedido**, com comentário (convite aparece quando o pedido é retirado).

## O que tem no app

**Jornada de app** — a primeira tela é o **login**, com a escolha **Cliente · Restaurante · Gestor** no topo.
O app **sempre abre na tela de entrar ou criar conta**; depois do login o cliente cai em **“O que comer agora?”**. Layout responsivo (celular, tablet e computador),
abas no rodapé, carrinho flutuante, instalável na tela inicial (PWA) e offline. Interface sem textos explicativos.

**Cliente**
- Cadastro só com **e-mail e senha** (WhatsApp opcional).
- Início: “O que comer agora?” (texto ou voz), **Indicado pra você** e **Em promoção agora** em grade que se ajusta à tela
  (2 colunas no celular, 3 no tablet, 6 no computador — nenhum card cortado), com ilustração de cada prato.
- As indicações usam o perfil de gosto por trás; o cliente não vê percentuais nem o perfil calculado.
- **Personalizar gosto (opcional)** no fim do Perfil: o que curte, restrições, **quanto custa por refeição (até R$ 20 · R$ 20–35 · R$ 35–50 · acima de R$ 50)** e horário.
- **Carrinho começa em 0:** só o botão **+**; o primeiro toque coloca 1 e vira − 1 +.
- **Pedidos em quadro kanban** (Recebido → Preparando → Pronto) + anteriores com “Pedir de novo” e estrelas.
- **Aviso no WhatsApp quando a comida ficar pronta:** opção no carrinho (pede o número se ainda não tiver) ou no cartão do pedido.
- Pagamento: **Pix real** (QR/copia e cola no padrão do Banco Central), **Mercado Pago** (link da loja), cartão simulado ou no balcão.
- Chat com a loja, apagar histórico de buscas, apagar conta (LGPD).

**Restaurante**
- **Pedidos em quadro kanban** (Recebido · Preparando · Pronto · Retirado): arrastar e soltar no computador, botões no celular,
  som e aviso a cada pedido novo. Ao marcar **Pronto**, o app **abre o WhatsApp do cliente com a mensagem pronta** (configurável em Loja).
- Seja afiliado (CNPJ validado, itens com título e subtítulo, código de e-mail, aprovação do gestor).
- Adicionar item, colar lista, editar, pausar, excluir; chat; avaliações; dados da loja, Pix, Mercado Pago, capacidade por horário.

**Gestor (PUC-Rio)**
- **Ranking de engajamento** dos restaurantes (score 0–100: pedidos, nota, tempo de resposta no chat, cardápio atualizado, promoções, pedidos concluídos) + CSV.
- **Restaurantes** (base completa, aprovar/recusar/suspender, CSV); **Clientes** (base de clientes, CSV); **Infraestrutura** (m², balcões, vendas/m², pico); **Registro** (auditoria). NPS dentro de Engajamento.

## WhatsApp: o que é automático

| Hoje (site estático) | Com back-end |
|---|---|
| Ao marcar Pronto, o celular/computador da loja **abre o WhatsApp já com a mensagem e o número do cliente**; a loja só toca em enviar. | Envio 100% automático pela **WhatsApp Cloud API** (template “pedido pronto”), sem ninguém tocar em nada — ver `blueprint-n8n.md`. |

## Segurança do cadastro (resposta à banca)

- Cada restaurante só enxerga os **próprios** pedidos, conversas, avaliações e registros.
- Senhas com **SHA-256 + sal por conta**.
- Afiliado novo: **CNPJ válido → código de e-mail → aprovação do gestor**. Tudo no registro de atividades.
- Limite do protótipo: sem servidor, os dados ficam no navegador. No piloto: back-end do `blueprint-n8n.md` com Row Level Security.

## Stack

HTML + CSS + JavaScript puro, um único arquivo. Persistência em `localStorage` (sessão por aba em `sessionStorage`).
QR Code gerado no navegador com a biblioteca de Kazuhiko Arase (MIT, embutida — ver [`THIRD-PARTY.md`](THIRD-PARTY.md)).
PWA: `manifest.json` + `sw.js`. IA local por regras + Claude (Messages API) opcional.

## Estrutura

```
index.html                    # o app inteiro (cliente, restaurante e gestor)
manifest.json, sw.js          # instalar na tela inicial + offline
assets/                       # logo e ícones do app
data/cardapios.json           # base construída: 9 restaurantes, 97 itens com título, subtítulo, preço e tags
docs/ROTEIRO.md               # 5.1 Roteiro (antes de construir)
docs/AI-LOG.md                # 5.2 AI Log (durante a construção)
docs/RELATORIO-FINAL.md       # 5.3 Relatório final
docs/JORNADA-APP.md           # mapa de telas e jornadas
docs/AVALIACAO-USUARIOS.md    # roteiro de teste com alunos e restaurantes
docs/ROTEIRO-VIDEO.md         # roteiro do vídeo de 2 minutos
docs/PROPOSTA-v4.md           # proposta anterior (histórico)
blueprint-n8n.md              # versão com back-end (n8n + Postgres + Claude + WhatsApp + Pix/MP)
CONTINUAR.md                  # como retomar o projeto
apresentacoes/                # sprint (17 slides) e pitch de 30 s (.pptx)
```

## Entregáveis do Impact Lab

| Entregável | Onde |
|---|---|
| Vídeo de até 2 min | roteiro em `docs/ROTEIRO-VIDEO.md` |
| Sprint e pitch | `apresentacoes/FaculFood-Sprint.pptx` · `apresentacoes/FaculFood-Pitch-30s.pptx` |
| Artefato online e replicável | GitHub Pages deste repositório |
| Repositório público com README | este arquivo |
| Roteiro · AI Log · Relatório final | `docs/ROTEIRO.md` · `docs/AI-LOG.md` · `docs/RELATORIO-FINAL.md` |

## Limitações

- Dados por navegador: cliente e loja só se veem no mesmo navegador (duas abas). Multiusuário real exige o back-end do blueprint.
- Pix: o QR é válido, mas a confirmação é manual pela loja (confirmação automática exige webhook de um PSP). As lojas de demonstração usam chaves fictícias.
- Mercado Pago: usa o link de pagamento da loja (valor digitado pelo cliente). Checkout Pro com valor exato exige back-end.
- WhatsApp: abre a conversa com a mensagem e o número prontos (wa.me). Envio sem toque exige a WhatsApp Cloud API.
- Microfone depende do navegador (Chrome, Edge, Safari) e de HTTPS.
- Afiliados marcados “(exemplo)” são fictícios, criados para demonstrar o fluxo.
