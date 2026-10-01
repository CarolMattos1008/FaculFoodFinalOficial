# Jornada de app — FaculFood v8

Layout responsivo: coluna única no celular, grade de 3 colunas no tablet e 6 no computador; abas fixas no rodapé; carrinho flutuante.
Instalável na tela inicial (PWA). Interface sem textos explicativos.

## Primeira tela: login

```
┌──────────────────────────────┐
│          [logo] FaculFood     │
│ ┌─────────┬───────────┬──────┐│
│ │🧑‍🎓Cliente│🏪Restaurante│📊Gestor││
│ └─────────┴───────────┴──────┘│
│  Entrar como cliente          │
│  E-mail  [               ]    │
│  Senha   [               ]    │
│  [        Entrar         ]    │
│  [      Criar conta      ]    │
└──────────────────────────────┘
```
Cada perfil tem **Entrar** e **Criar conta** (restaurante: “seja um restaurante afiliado”; gestor: e-mail @puc-rio.br). O app sempre abre nesta tela (também ao recarregar).

## Cliente

```mermaid
flowchart LR
  A[Login / Criar conta<br/>e-mail + senha] --> B[O que comer agora?]
  B -. opcional .-> Q[O que você gosta?]
  B --> C[Indicado pra você · Em promoção]
  C --> D[Cardápio<br/>+ começa em 0]
  D --> E[Carrinho<br/>horário · pagamento · aviso WhatsApp]
  E --> F[Pix QR / Mercado Pago]
  F --> G[Acompanhar<br/>⚪ não confirmado → 🔴 fila → 🟡 preparo → 🟢 pronto]
  G --> H[WhatsApp + alarme: pronto!]
  H --> I[Retira e avalia<br/>restaurante + pedido]
```
Topo: selo **Cliente** (menu: perfil, trocar, sair). Abas: **Início** · **Lojas** · **Acompanhar** · **Conversar** (converse com o estabelecimento) · **Perfil** (WhatsApp, histórico, avaliar app, apagar conta,
e no fim **Personalizar gosto — opcional**).

## Restaurante

```mermaid
flowchart LR
  A[Criar conta · seja afiliado<br/>interesse: nome, e-mail, senha, nº PUC] --> C[Gestor analisa e aprova]
  A --> I[Itens à venda<br/>estoque · desconto · foto]
  C --> D[Kanban de pedidos<br/>som a cada pedido]
  D --> E[✓ Pago · Preparar → · Pronto →]
  E --> F[WhatsApp abre com a mensagem<br/>para o cliente]
  F --> G[Resultados<br/>itens mais pedidos · pico]
```
Login → **Itens à venda** (estoque, desconto, foto, ler cardápio por foto). Abas: **Itens** · **Pedidos** (mesmo quadro do cliente) · **Resultados** · **Chat** · **Loja**.

## Gestor (PUC-Rio)

Criar conta (e-mail @puc-rio.br) ou entrar. Abas: **Engajamento** (por vendas, por avaliação ou geral + CSV; NPS do app) · **Restaurantes** (base completa, analisar interesses, aprovar/recusar/suspender, CSV) · **Clientes** (base de clientes, CSV) · **Infraestrutura** (m², balcões, vendas/m², pico) · **Registro**.
