# FaculFood — como continuar o projeto

Versão salva em 30/09/2026 (**v11**: app sempre abre no login/criar conta, 3 filtros mais pedidos em uma linha na busca; antes, **v10**: bases de restaurantes e clientes no gestor com CSV, alarme de pronto como opção no Perfil, apresentações de sprint e pitch em `apresentacoes/`; antes, **v9**: cancelar conta neutro, perfil sem bloco Avançado, foto/ícone por culinária nos restaurantes; antes, **v8**: sem atalho de demonstração, criar conta nos 3 perfis, afiliação = interesse para o gestor, pagamento informado confirma o pedido, pedido só em Acompanhar, aba Infraestrutura do gestor; antes, **v7**: itens à venda com estoque/desconto/foto, leitura de cardápio por foto, ícones de linha, filtro de gosto opcional, gestor por vendas/avaliação; antes, **v6**: status com cores cinza/vermelho/amarelo/verde, alarme em tela cheia, selo do perfil no topo, busca sem histórico, aba Resultados, avaliação do restaurante e do pedido, afiliado com nº de cadastro PUC). Comece por aqui quando retomar.

## 1. Estado

App de pedidos para retirada no balcão (PUC-Rio, LIA Impact Lab — Caso 4). Um `index.html` estático com três perfis
(cliente, restaurante, gestor), dados no `localStorage` (chave `faculfood_v8`), sessão só na aba (`sessionStorage`); ao abrir ou recarregar, o app volta para o login. Funcionalidades: ver `README.md`.
Processo: `docs/ROTEIRO.md`, `docs/AI-LOG.md`, `docs/RELATORIO-FINAL.md`.

## 2. Mapa do código (`index.html`)

Dois `<script>`: o primeiro é a biblioteca de QR (não mexer); o segundo é o app, nesta ordem:

| Bloco | O que faz |
| --- | --- |
| `sha256`, `hashSenha`, `norm`, `lev`, `precoFinal` | Utilitários (senha com sal, texto sem acento, erro de digitação, desconto) |
| `PERSONAS`, `tagger`, `tagsOf` | 8 personas e tags por item (título + categoria + subtítulo + declarado) |
| `SUBS`, `seedBase`, `seed` | 5 restaurantes reais + 3 afiliados de exemplo + 1 pendente, aluno demo, conta PUC |
| `logEvento` | Registro de atividades (auditoria) |
| `load`, `save`, `prefs` | Persistência; `prefs` guarda a chave do Claude só no aparelho |
| `go`, `aba`, `voltar`, `TITULOS` | Navegação (pilha) e troca de aba |
| `combinaDet`, `preferencia` | “% combina” com pesos da IA, gostos, evitar, restrições, orçamento |
| `indice`, `resolverTermo`, `buscar`, `perguntar` | Busca “O que comer agora?” (conversa salva por aluno) |
| `pixPayload`, `crc16`, `qrSVG` | Pix BR Code + QR |
| `mpValido`, `cnpjValido`, `matriculaValida`, `luhn` | Validações |
| `waLink`, `msgClienteParaLoja`, `STATUS_MSG` | WhatsApp |
| `conversa`, `enviarMsg`, `naoLidas*` | Chat aluno ↔ loja |
| `IA_PERGUNTAS`, `entenderLocal`, `iaLocalResponder`, `iaClaudeResponder`, `falarComIA` | Fac, IA de persona |
| `viewEntrada`, `viewAfiliado`, `questHTML` | Login com 3 perfis, afiliação, personalizar gosto (no Perfil) |
| `fotoItem`, `itemCard` | Ilustração do prato e card em grade |
| `viewMeusPedidos` / `viewOwnerPedidos`, `kcard*` | Kanban de pedidos (cliente e loja); arrastar e soltar em `dragstart/drop` |
| `avisarProntoWhats` | Abre o WhatsApp do cliente ao marcar Pronto |
| `STATUS_LABEL`, `STATUS_ATIVOS`, `statusDot` | Fluxo aguardando → fila → preparando → pronto → retirado e suas cores (`--c-*` no CSS) |
| `seedHistorico`, `viewOwnerResultados` | Pedidos de demonstração e aba Resultados (itens mais pedidos, pico) |
| `viewAvaliarPedido` | Avaliação do restaurante + pedido |
| `renderAlarme` | Alarme de pronto em tela cheia |
| `ICON`, `mono`, `thumbHTML` | Ícones de linha, monograma do restaurante, foto/ícone do item |
| `viewOwnerMenu` | Itens à venda: estoque, venda liga/desliga, desconto |
| `viewOwnerLer`, `lerCardapio`, `parseCardapio`, `lerComClaude`, `lerComOCR` | Ler cardápio por foto |
| `reduzirImagem` | Reduz fotos no navegador antes de salvar |
| `estiloRest`, `mono`, `capaRest` | Logo do restaurante (foto da loja ou ícone da culinária) e capa do cardápio |
| `handleSignupGestor`, `DB.gestores` | Contas de gestor (e-mail @puc-rio.br) |
| `viewPucInfra` | Infraestrutura: m², balcões, vendas/m², pico do balcão |
| `FILTROS_CANDIDATOS`, `filtrosMaisUsados` | Os 3 filtros mais pedidos abaixo de “O que comer agora?” |
| `viewPucRestaurantes` | Base de restaurantes: filtro, busca, aprovar/recusar/suspender, CSV |
| `viewPucClientes`, `resumoCliente`, `baixarCSV` | Base de clientes e exportação CSV |
| `viewHome` … `viewAvaliar` | Telas do aluno |
| `viewOwner*` | Telas do restaurante |
| `metricas`, `viewPuc*` | Gestor: ranking de engajamento, cadastros, retirada, usuários, registro |
| `ABAS`, `VIEWS`, `PERMITIDAS`, `render*` | Casca de app e permissões por perfil |
| `ACOES` + ouvintes `click/input/submit` | Todos os eventos (atributo `data-act` / `data-form`) |
| `handle*`, `mudarStatus`, `finalizarPedido` | Regras de negócio |

**Para criar uma tela:** escreva `viewX()`, registre em `VIEWS`, `PERMITIDAS` e `TITULOS`. **Para um botão:** `data-act="nome"` + função em `ACOES`.

## 3. Testar

- Duas abas: cliente numa, restaurante na outra (pedido novo toca som na loja; “Pronto” toca no aluno).
- Pix: o QR pode ser lido pelo app do banco; nas lojas de demonstração a chave é fictícia (não pague).
- Claude: Restaurante → Loja → chave `sk-ant-…` (leitura do cardápio por foto).
- Alarme: Perfil → “Tocar quando o pedido ficar pronto”.
- Zerar: apagar as chaves `faculfood_v8*` do `localStorage`.

## 4. Próximos passos

1. **Back-end com tempo real (Supabase)** para cliente e loja em celulares diferentes — hoje só sincroniza entre abas do mesmo navegador.
1. Teste com usuários (`docs/AVALIACAO-USUARIOS.md`) e calibrar a capacidade de retirada.
2. Conversa com Felipe Rangel e coordenação: critérios de engajamento para concessão.
3. Back-end (blueprint, seção v5): Supabase + RLS, webhooks de Pix/Mercado Pago, WhatsApp Cloud API.
4. Cardápio por foto (F1) na tela “Adicionar item”.
5. Horário de venda por item e “não retirado” automático após 30 min.

## 5. Para retomar com o Claude

Anexe o zip e diga: “Leia o CONTINUAR.md e o index.html do FaculFood v5. Quero continuar a partir daqui: […]. Mantenha o layout de app.”
