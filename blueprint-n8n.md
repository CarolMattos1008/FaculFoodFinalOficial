# Blueprint n8n: Sistema Integrado de Restaurantes PUC-Rio

Case 4, Workshop SIEng 2026. Versão 3 do schema (dois apps, agendamento, peso fora de escopo).
Data do documento: 28/08/2026.

Convenções usadas em todos os workflows:

- Timezone fixo `America/Sao_Paulo` no setting do workflow. Toda data persistida em ISO 8601 com offset.
- Persistência: Postgres (Supabase). Realtime pelo canal `cardapio:{ponto_de_venda}` e `fila:{ponto_de_venda}`.
- Autenticação do APP RESTAURANTE: header `X-Ponto-Token`. O token resolve para exatamente um `ponto_de_venda_id`. **Nenhum workflow confia no `ponto_de_venda` que vem no corpo do payload**, ele só é aceito se for igual ao do token. É esse nó que implementa a regra 6.
- Todo webhook responde por `Respond to Webhook` explícito, nunca "immediately", porque a resposta carrega decisão de negócio.
- Todo workflow tem um `Error Trigger` irmão que grava em `log_erro` e avisa o canal de operação. Nenhum erro é silencioso.
- Idempotência: todo webhook de escrita aceita `request_id` (uuid do cliente) e tem índice único em `(workflow, request_id)`. Reenvio devolve a resposta original em vez de duplicar.

Tabelas usadas além das quatro entidades do modelo:

`excecoes_coleta`, `fila_revisao`, `item_preco_historico`, `slot_reserva`, `pedido_lembrete`, `onboarding_token`, `log_erro`, `notificacao_falha`.

---

## F1 Ingestão de cardápio

**Gatilho:** `Webhook` POST `/webhook/ingest-cardapio`, multipart, campo `foto` (binário) mais `ponto_de_venda_id` e `coletor`.

**Nós em ordem:**

1. `Webhook` (POST, binaryData true, responseMode responseNode)
2. `Code: normalizaUpload` valida mime `image/jpeg|image/png|image/heic` e tamanho até 8 MB, gera `coleta_id` (uuid), converte para base64, carimba `data_coleta` com a data de hoje no fuso do campus.
3. `HTTP Request: claude-vision` POST `https://api.anthropic.com/v1/messages`, `max_tokens` 8000, temperatura 0, imagem em `source.type=base64`. Prompt de extração no fim deste documento. Retry 3x, backoff exponencial, timeout 120 s.
4. `Code: parseJSON` faz `JSON.parse` do bloco retornado dentro de try/catch. Falha nas duas tentativas manda a foto e o texto cru para `coleta_falha` e encerra com 422. Nunca inventa item para "salvar" a ingestão.
5. `Code: validaSchema` (AJV inline, schema estrito). Rejeita `categoria` fora das 12, `restricoes` fora do enum, `preco_brl` que não seja número ou null, `confianca` fora de alta|media|baixa. Item que falha vai para `fila_revisao` com `motivo: "schema_invalido"`, não é descartado.
6. `Switch: roteiaPorPrecificacao`, três saídas:
   - **peso** quando `unidade_preco` != `item`, ou quando `preco_por_peso_detectado` = true, ou quando `descricao` casa com `/(por\s+)?(quilo|kg|100\s?g|self[- ]service|à\s?vontade\s+por\s+peso)/i`
   - **sem_preco** quando `preco_brl` é null e não é peso
   - **valido** para o resto
7. Saída **peso** para `Postgres: insert excecoes_coleta` com `motivo: "precificado_por_peso"` e o texto original. Regra 4.
8. Saída **sem_preco** para `Postgres: insert item` com `preco_brl: null`, `ativo: false`, e `insert fila_revisao` com `motivo: "preco_ausente"`. O item existe na base, aparece na auditoria, e não aparece no app cliente.
9. `Code: dedupHash` gera `hash = sha1(ponto_de_venda + '|' + slug(item) + '|' + (variacao ?? ''))`.
10. `Postgres: upsert item` por `hash`. Em conflito, mantém o `id` antigo, atualiza os campos e preserva `descricao` original em `descricao_historico[]`. Regra 5.
11. `IF: confianca === "alta"` verdadeiro para `Postgres: update item set ativo = true` e `Redis/Realtime publish cardapio:{ponto}`; falso para `Postgres: insert fila_revisao` com `motivo: "confianca_" + confianca` e `ativo` continua false, mais `Gmail/Slack: avisa curador`.
12. `Respond to Webhook` 200 com o resumo da coleta.

**Tratamento de erro:** falha da API Claude após 3 tentativas grava em `log_erro` e devolve 503 com `coleta_id`, a foto fica na fila para reprocessar. Falha de banco no meio do lote roda dentro de transação por foto, então ou entra a foto inteira ou nenhum item dela.

**Entrada:**

```json
{
  "request_id": "0a1f5c2e-9b4d-4a71-9f0e-2c8d1b7a4e33",
  "ponto_de_venda_id": "pdv_falafel",
  "coletor": "guilherme.cano",
  "foto": "<binário multipart>",
  "observacao_coleta": "cardápio da parede, foto frontal, 12h40"
}
```

**Saída:**

```json
{
  "coleta_id": "col_20260828_0007",
  "ponto_de_venda_id": "pdv_falafel",
  "data_coleta": "2026-08-28",
  "itens_extraidos": 9,
  "publicados": 6,
  "em_revisao": 2,
  "excecoes": 1,
  "itens": [
    {
      "id": "itm_falafel_0003",
      "ponto_de_venda": "pdv_falafel",
      "tipo": "lanchonete",
      "item": "Wrap de falafel",
      "descricao": "Wrap de falafel com homus, salada e molho de tahine",
      "categoria": "sanduiche_burger",
      "preco_brl": 28.0,
      "unidade_preco": "item",
      "variacao": null,
      "preco_condicional": null,
      "restricoes": ["vegetariano"],
      "horario_funcionamento": "11:00-20:00",
      "forma_de_pedido": "balcao",
      "data_coleta": "2026-08-28",
      "confianca": "alta",
      "origem": "foto_real",
      "ativo": true
    }
  ],
  "fila_revisao": [
    {
      "id": "itm_falafel_0008",
      "item": "Suco do dia",
      "preco_brl": null,
      "confianca": "baixa",
      "motivo": "preco_ausente",
      "ativo": false
    }
  ],
  "excecoes_coleta": [
    {
      "ponto_de_venda": "pdv_falafel",
      "texto_original": "Self-service R$ 8,90 / 100g",
      "motivo": "precificado_por_peso",
      "regra": "escopo_v3_preco_fechado_por_unidade",
      "data_coleta": "2026-08-28"
    }
  ]
}
```

---

## F2 Atualização de preço pelo restaurante

**Gatilho:** `Webhook` POST `/webhook/preco-atualizar`, header `X-Ponto-Token`.

**Nós em ordem:**

1. `Webhook`
2. `Code: authPonto` resolve o token. Token inválido ou expirado devolve 401. Se `body.ponto_de_venda` != `token.ponto_de_venda`, devolve 403 `escopo_invalido`. **Este é o nó que impede o dono A editar o cardápio do dono B.**
3. `Postgres: select item WHERE id = $1 AND ponto_de_venda = $2` com o ponto vindo do token, nunca do corpo. Zero linhas devolve 404.
4. `Code: validaPreco`: número, maior que 0, no máximo 2 casas, teto de sanidade R$ 500,00 por item avulso. Fora disso, 422 `preco_invalido`.
5. `Code: calculaVariacao`: `variacao_pct = (novo - atual) / atual`. Item com `preco_brl` null pula o teste de variação e entra como primeiro preço, com flag `primeiro_preco: true`.
6. `IF: |variacao_pct| > 0.30 AND confirmacao_dono !== true` devolve **409 `confirmacao_requerida`** com o payload de confirmação pronto para o app reenviar. Não grava nada.
7. `Postgres: transação` com dois comandos: `insert item_preco_historico` (append-only, guarda preço antigo, novo, autor, timestamp, motivo) e `update item set preco_brl, atualizado_em`. Se o insert do histórico falhar, o update não acontece. **Não existe alteração de preço sem rastro.**
8. `Redis/Supabase: publish cardapio:{ponto}` com o item novo. O app cliente reassina e repinta o card.
9. `Respond to Webhook` 200.

**Tratamento de erro:** falha na publicação em tempo real não desfaz a gravação, entra em `notificacao_falha` e um `Schedule` de 1 min reenvia. Preço no banco é a fonte da verdade, o realtime é cache.

**Entrada:**

```json
{
  "request_id": "b2c9d4e1-7f30-4c22-8a55-6d1e0f9a3b41",
  "ponto_de_venda": "pdv_falafel",
  "item_id": "itm_falafel_0003",
  "preco_novo": 32.0,
  "motivo": "reajuste de fornecedor",
  "autor": "dono@ofalafel.com",
  "confirmacao_dono": false
}
```

**Saída 409 (variação acima de 30%):**

```json
{
  "status": "confirmacao_requerida",
  "item_id": "itm_falafel_0003",
  "preco_atual": 28.0,
  "preco_novo": 42.0,
  "variacao_pct": 50.0,
  "mensagem": "Aumento de 50,0%. Confirme para publicar.",
  "reenviar_com": { "confirmacao_dono": true }
}
```

**Saída 200:**

```json
{
  "status": "publicado",
  "item_id": "itm_falafel_0003",
  "preco_anterior": 28.0,
  "preco_atual": 32.0,
  "variacao_pct": 14.29,
  "versao": 4,
  "historico_id": "hist_000412",
  "publicado_em": "2026-08-28T13:22:05-03:00",
  "canal_realtime": "cardapio:pdv_falafel"
}
```

---

## F3 Combos e promoções

Três workflows irmãos que compartilham a tabela `combo`.

### F3a Criação e edição (webhook)

**Gatilho:** `Webhook` POST `/webhook/combo-criar`, header `X-Ponto-Token`.

**Nós:**

1. `Webhook`
2. `Code: authPonto` (idêntico ao F2)
3. `Postgres: select itens WHERE id = ANY($itens_ids) AND ponto_de_venda = $token_ponto`
4. `Code: validaItens`: a contagem retornada precisa bater com o tamanho de `itens_ids`. Se não bate, existe item de outro ponto ou inexistente na lista, devolve 422 `item_fora_do_ponto`. Item com `preco_brl` null derruba a criação com 422 `preco_indefinido`, porque combo sobre preço null produz desconto falso.
5. `Code: calculaDesconto`: `preco_soma_itens = Σ preco_brl`, `desconto_pct = (1 - preco_combo / preco_soma_itens) * 100`, arredondado em 2 casas.
6. `IF: preco_combo >= preco_soma_itens` devolve 422 `combo_mais_caro` com o valor da soma, a menos que venha `aceito_ciente: true`. Nesse caso grava com `desconto_pct` negativo e flag, e o app mostra o aviso.
7. `Code: validaVigencia`: `vigencia_fim` maior que `vigencia_inicio`, `vigencia_fim` não pode estar no passado, janela máxima de 180 dias.
8. `Postgres: upsert combo` com `criado_por` do token e `ativo` calculado por `now() between inicio e fim`.
9. `Realtime publish cardapio:{ponto}`
10. `Respond to Webhook` 201.

### F3b Expiração automática (schedule)

**Gatilho:** `Schedule Trigger`, `5 0 * * *` (00:05, America/Sao_Paulo).

**Nós:** `Schedule` → `Postgres: select combo WHERE ativo = true AND vigencia_fim < current_date` → `SplitInBatches` → `Postgres: update combo set ativo = false, desativado_em = now(), desativado_por = 'job_f3b'` → `Realtime publish` → `Gmail/WhatsApp: avisa dono` → `Postgres: insert log_job`.

Idempotente por construção: o filtro `ativo = true` faz a segunda execução no mesmo dia não achar nada.

### F3c Alerta 24h antes (schedule)

**Gatilho:** `Schedule Trigger`, `0 * * * *` (de hora em hora).

**Nós:** `Schedule` → `Postgres: select combo WHERE ativo = true AND vigencia_fim between now() and now() + interval '24 hours' AND alerta_24h_enviado = false` → `SplitInBatches` → `Switch canal_pedido` → `WhatsApp/Gmail` → `Postgres: update combo set alerta_24h_enviado = true`. A flag é gravada só depois do envio confirmado, então falha de envio reenvia na hora seguinte em vez de sumir.

**Entrada F3a:**

```json
{
  "request_id": "7c4b1a90-3e52-4a13-9b77-8f2c5d6e1a04",
  "ponto_de_venda": "pdv_falafel",
  "nome": "Combo almoço wrap + suco",
  "itens_ids": ["itm_falafel_0003", "itm_falafel_0011"],
  "preco_combo": 34.0,
  "vigencia_inicio": "2026-08-28",
  "vigencia_fim": "2026-09-30",
  "criado_por": "dono@ofalafel.com",
  "aceito_ciente": false
}
```

**Saída 201:**

```json
{
  "id": "cmb_falafel_0002",
  "ponto_de_venda": "pdv_falafel",
  "nome": "Combo almoço wrap + suco",
  "itens_ids": ["itm_falafel_0003", "itm_falafel_0011"],
  "preco_combo": 34.0,
  "preco_soma_itens": 40.0,
  "desconto_pct": 15.0,
  "vigencia_inicio": "2026-08-28",
  "vigencia_fim": "2026-09-30",
  "ativo": true,
  "criado_por": "dono@ofalafel.com",
  "avisos": []
}
```

**Saída 422 (combo mais caro):**

```json
{
  "status": "combo_mais_caro",
  "preco_combo": 44.0,
  "preco_soma_itens": 40.0,
  "desconto_pct": -10.0,
  "mensagem": "O combo custa R$ 4,00 a mais que os itens avulsos.",
  "reenviar_com": { "aceito_ciente": true }
}
```

---

## F4 Pedido agendado

O workflow crítico. É onde o sistema pode aceitar um pedido impossível.

**Gatilho:** `Webhook` POST `/webhook/pedido`, sem token de restaurante (o cliente é anônimo), com `request_id` obrigatório.

**Nós em ordem:**

1. `Webhook`
2. `Postgres: select por request_id`. Se já existe, devolve a resposta original e para. Impede pedido duplicado por duplo clique ou retry de rede.
3. `Code: validaCarrinho`: carrinho não vazio; **todos os `item_id` e `combos_ids` do mesmo `ponto_de_venda`**, senão 422 `carrinho_misto`; `qtd` inteiro entre 1 e 20.
4. `Postgres: select ponto_de_venda + itens + combos` do banco.
5. `Code: validaDisponibilidade`: item com `ativo = false` ou `preco_brl` null derruba o pedido com 409 `item_indisponivel` e a lista dos ids. Combo com `ativo = false` ou fora da vigência é removido com aviso.
6. `Code: recalculaTotal` soma **pelo preço do banco**, nunca pelo total enviado pelo cliente. Se divergir, o servidor vence e a resposta carrega `total_corrigido: true`.
7. `IF: ponto.aceita_agendamento === false` devolve 409 `ponto_sem_agendamento` com `canal_pedido` para o cliente pedir no balcão.
8. `Code: validaJanela`, quatro testes em sequência:
   - `horario_retirada` cai dentro de `horario_funcionamento` do dia da semana pedido
   - `horario_retirada >= now + tempo_preparo_min`
   - `horario_retirada <= now + 7 dias`
   - `horario_retirada` alinhado ao grid de `intervalo_slot_min` a partir da abertura
   Falha em qualquer um devolve 409 com `motivo` específico mais os 3 slots válidos mais próximos.
9. `Postgres: reservaSlot` em transação `SERIALIZABLE`, comando único condicional:

   ```sql
   INSERT INTO slot_reserva (ponto_de_venda, slot_inicio, pedido_id)
   SELECT $1, $2, $3
   WHERE (
     SELECT count(*) FROM slot_reserva sr
     JOIN pedido p ON p.id = sr.pedido_id
     WHERE sr.ponto_de_venda = $1 AND sr.slot_inicio = $2
       AND p.status <> 'cancelado'
   ) < (SELECT capacidade_por_slot FROM ponto_de_venda WHERE id = $1)
   RETURNING id;
   ```

   Com índice `unique (ponto_de_venda, slot_inicio, pedido_id)`. **Este nó é a única barreira contra overbooking.** Contagem em `Code` antes do insert não serve, porque duas execuções paralelas do webhook leem o mesmo número.
10. `IF: rowcount === 0` para `Code: proximos3Slots`, que varre o grid para frente respeitando funcionamento, preparo e capacidade, e devolve 409 `slot_lotado` com as três alternativas. Nunca aceita e "conserta depois".
11. `Code: geraCodigoRetirada`: 6 caracteres base32 sem vogais, único por `(ponto, data)`.
12. `Postgres: insert pedido` com `status: "aguardando"` na mesma transação da reserva.
13. `Switch: canal_pedido`
    - `whatsapp` para `HTTP Request` na Cloud API com o resumo formatado
    - `email` para `Gmail: send`
    - `balcao` para `NoOp`, o pedido fica visível só na fila do painel
14. `IF: envio falhou` grava em `notificacao_falha` e mantém o pedido. **A reserva não é desfeita por falha de notificação**, senão o cliente perde a vaga por um problema que não é dele. O painel do dono é a fonte de verdade redundante.
15. `Postgres: insert pedido_lembrete` com duas linhas: `disparar_em = retirada - 15 min` (cliente) e `disparar_em = retirada - tempo_preparo_min` (restaurante).
16. `Respond to Webhook` 201 com a confirmação.

**Workflow irmão F4b, disparo dos lembretes:** `Schedule Trigger` `*/5 * * * *` → `select pedido_lembrete WHERE disparar_em <= now() AND enviado = false AND pedido.status not in ('cancelado','retirado')` → envia → marca `enviado = true`. Uso deliberado de scanner em vez do nó `Wait`: `Wait` longo depende do processo do n8n continuar vivo e não sobrevive a restart, e agendamento de retirada pode ser para dias depois.

**Tratamento de erro:** qualquer exceção entre os nós 9 e 12 desfaz a transação inteira, então não existe reserva órfã sem pedido. Erro depois do 12 é compensado pelo scanner, não pelo usuário.

**Entrada:**

```json
{
  "request_id": "e91a72b4-5c8d-4f16-b0a3-7d24e1c9f508",
  "ponto_de_venda": "pdv_falafel",
  "nome_cliente": "Guilherme C.",
  "contato": "+5521999990000",
  "itens": [
    { "item_id": "itm_falafel_0003", "qtd": 1, "obs": "sem cebola" },
    { "item_id": "itm_falafel_0011", "qtd": 2, "obs": null }
  ],
  "combos_ids": [],
  "total_brl_cliente": 52.0,
  "horario_retirada": "2026-08-28T12:30:00-03:00",
  "canal": "app_cliente"
}
```

**Saída 201:**

```json
{
  "id": "ped_20260828_0031",
  "status": "aguardando",
  "ponto_de_venda": "pdv_falafel",
  "nome_ponto": "O Falafel",
  "local_campus": "Praça da Alimentação, RDC",
  "codigo_retirada": "K7XM2P",
  "horario_retirada": "2026-08-28T12:30:00-03:00",
  "tempo_espera_min": 22,
  "itens": [
    { "item_id": "itm_falafel_0003", "item": "Wrap de falafel", "qtd": 1, "preco_unit": 28.0, "obs": "sem cebola" },
    { "item_id": "itm_falafel_0011", "item": "Suco natural 300ml", "qtd": 2, "preco_unit": 12.0, "obs": null }
  ],
  "combos_ids": [],
  "total_brl": 52.0,
  "total_corrigido": false,
  "criado_em": "2026-08-28T12:08:14-03:00",
  "canal": "app_cliente",
  "roteado_para": { "canal_pedido": "whatsapp", "status_envio": "entregue" },
  "lembretes": [
    { "destino": "cliente", "disparar_em": "2026-08-28T12:15:00-03:00" },
    { "destino": "restaurante", "disparar_em": "2026-08-28T12:15:00-03:00" }
  ]
}
```

**Saída 409 (slot lotado):**

```json
{
  "status": "slot_lotado",
  "ponto_de_venda": "pdv_falafel",
  "horario_solicitado": "2026-08-28T12:30:00-03:00",
  "capacidade_por_slot": 4,
  "ocupados": 4,
  "alternativas": [
    "2026-08-28T12:45:00-03:00",
    "2026-08-28T13:00:00-03:00",
    "2026-08-28T13:15:00-03:00"
  ],
  "mensagem": "12:30 está cheio. Escolha um dos horários livres."
}
```

**Saída 409 (dentro do tempo de preparo):**

```json
{
  "status": "horario_invalido",
  "motivo": "tempo_preparo",
  "agora": "2026-08-28T12:08:14-03:00",
  "tempo_preparo_min": 20,
  "primeiro_horario_possivel": "2026-08-28T12:30:00-03:00",
  "alternativas": [
    "2026-08-28T12:30:00-03:00",
    "2026-08-28T12:45:00-03:00",
    "2026-08-28T13:00:00-03:00"
  ]
}
```

---

## F5 Saúde da base

**Gatilho:** `Schedule Trigger`, `0 8 * * 1` (segunda, 08:00, America/Sao_Paulo).

**Nós:**

1. `Schedule`
2. `Postgres: select` itens `ativo = true` com `data_coleta < current_date - interval '30 days'`
3. `Code: agrupaPorPonto`
4. `Postgres: update item set preco_a_conferir = true`. **Não desativa o item**, porque preço velho ainda informa, preço apagado não. O app cliente mostra o selo "preço a conferir" e some com o item da comparação por preço mais barato.
5. `SplitInBatches` por ponto → `Switch canal_pedido` → `WhatsApp/Gmail` com a lista dos itens e link do painel
6. `Postgres: insert relatorio_saude`
7. `Slack/Gmail: resumo para a operação`

**Tratamento de erro:** envio que falha por ponto não interrompe o lote, `continueOnFail` ligado, e os pontos que falharam entram no resumo da operação.

**Saída (evento gravado):**

```json
{
  "relatorio_id": "saude_2026_W35",
  "executado_em": "2026-08-31T08:00:00-03:00",
  "itens_vencidos": 14,
  "pontos_afetados": [
    { "ponto_de_venda": "pdv_kakumi", "itens": 9, "coleta_mais_antiga": "2026-07-20", "notificado": true, "canal": "whatsapp" },
    { "ponto_de_venda": "pdv_lemax", "itens": 5, "coleta_mais_antiga": "2026-07-25", "notificado": false, "erro": "numero_invalido" }
  ],
  "acao": "marcados como preco_a_conferir, permanecem ativos"
}
```

---

## F6 Onboarding do restaurante

**Gatilho A:** `Webhook` POST `/webhook/onboarding-convite`, restrito à equipe do projeto (header `X-Admin-Key`).
**Gatilho B:** `Webhook` POST `/webhook/onboarding-completar`, aberto, autenticado pelo token do convite.

**Nós, fluxo A:**

1. `Webhook` admin
2. `Code: geraToken`: 32 bytes aleatórios em base64url. Grava só o `sha256` do token em `onboarding_token`, com `expira_em = now + 72h` e `uso_unico = true`.
3. `Postgres: insert ponto_de_venda` em rascunho (`aceita_agendamento: false`, parâmetros operacionais null). Ponto em rascunho não aparece no app cliente.
4. `Switch canal` → `WhatsApp/Gmail` com o link `painel?token=...`
5. `Respond` 201.

**Nós, fluxo B:**

6. `Webhook` completar
7. `Code: validaToken`: hash bate, não expirado, não usado. Falha devolve 401.
8. `Code: validaParametros`: `tempo_preparo_min` entre 5 e 120; `intervalo_slot_min` em {10, 15, 20, 30}; `capacidade_por_slot` entre 1 e 50; `horario_funcionamento` no formato `HH:MM-HH:MM` por dia da semana; `canal_pedido` no enum. Fora disso 422, sem defaults silenciosos. **Nenhum parâmetro operacional é chutado pelo sistema**, porque capacidade e preparo definem quais pedidos são possíveis.
9. `Postgres: update ponto_de_venda` com os parâmetros e `ativo = true`
10. `Postgres: select item WHERE ponto_de_venda = $1` (o que o F1 já extraiu das fotos) → devolve para o painel do dono em modo revisão
11. `Code: montaFilaRevisaoDono`: cada item vai com `preco_brl`, `descricao` original e `confianca`, para o dono confirmar ou corrigir item a item. Aprovação do dono sobe `confianca` para `alta` e `ativo` para true, e grava o autor da aprovação.
12. `Postgres: update onboarding_token set usado_em = now()`
13. `Realtime publish cardapio:{ponto}`
14. `Respond` 200.

**Tratamento de erro:** token queimado antes da conclusão do passo 9 deixaria o dono trancado, por isso a queima é o penúltimo nó e roda na mesma transação do update do ponto.

**Entrada B:**

```json
{
  "token": "9f2b...c41a",
  "ponto_de_venda": {
    "id": "pdv_falafel",
    "nome": "O Falafel",
    "tipo": "lanchonete",
    "local_campus": "Praça da Alimentação, RDC",
    "horario_funcionamento": { "seg-sex": "11:00-20:00", "sab": "11:00-16:00", "dom": null },
    "tempo_preparo_min": 20,
    "intervalo_slot_min": 15,
    "capacidade_por_slot": 4,
    "canal_pedido": "whatsapp",
    "contato_pedido": "+5521988887777",
    "aceita_agendamento": true
  }
}
```

**Saída B:**

```json
{
  "status": "onboarding_concluido",
  "ponto_de_venda": "pdv_falafel",
  "painel_url": "/painel/pdv_falafel",
  "itens_importados": 9,
  "itens_pendentes_de_aprovacao": 3,
  "slots_gerados_hoje": ["11:00", "11:15", "11:30", "11:45", "12:00"],
  "token_status": "usado",
  "primeiro_pedido_possivel": "2026-08-28T12:30:00-03:00"
}
```

---

## Onde o sistema corrompe a base ou aceita pedido impossível

| # | Falha possível | O que acontece sem barreira | Nó que impede |
|---|---|---|---|
| 1 | Claude Vision alucina preço que não está na foto | Preço falso publicado como real | F1 nó 11: só `confianca: alta` publica. Média e baixa param na `fila_revisao` com `ativo = false` |
| 2 | Item de self-service entra com preço "R$ 8,90" que é por 100g | Comparação de preço mente e o total do pedido fica errado | F1 nó 6, `Switch roteiaPorPrecificacao`, desvia para `excecoes_coleta` |
| 3 | Dois pedidos simultâneos para o último lugar do slot | Overbooking, cozinha não entrega | F4 nó 9, insert condicional em transação SERIALIZABLE. Contagem em memória não resolve |
| 4 | Cliente adultera o total no payload | Pedido registrado abaixo do preço | F4 nó 6, `recalculaTotal` server-side, o total do cliente é só conferência |
| 5 | Pedido para 12:15 quando são 12:08 e o preparo leva 20 min | Pedido impossível aceito, cliente chega e não tem comida | F4 nó 8, teste `retirada >= now + tempo_preparo_min` |
| 6 | Pedido para domingo num ponto que fecha domingo | Pedido fantasma na fila | F4 nó 8, teste de `horario_funcionamento` por dia da semana |
| 7 | Dono A edita preço do ponto B | Base corrompida entre estabelecimentos, quebra a regra 6 | F2 nó 2 e nó 3, o `ponto_de_venda` vem do token e entra no `WHERE` do SQL |
| 8 | Combo montado com item de outro ponto | Pedido que nenhuma cozinha consegue montar | F3a nó 4, contagem de itens retornados precisa bater com a lista enviada |
| 9 | Combo mais caro que a soma dos itens | Cliente pagando mais para "economizar" | F3a nó 6, bloqueia com 422 e só passa com `aceito_ciente` |
| 10 | Promoção vencida continua sendo vendida | Preço de tabela errado no caixa | F3b, job diário desativa por `vigencia_fim` |
| 11 | Reajuste digitado com vírgula errada (R$ 32 vira R$ 320) | Cardápio inteiro sem credibilidade | F2 nó 4 (teto de sanidade) e nó 6 (variação acima de 30% exige confirmação) |
| 12 | Reingestão da mesma foto duplica o cardápio | Base inflada, contagem da auditoria mente | F1 nó 9 e 10, hash de deduplicação e upsert |
| 13 | Preço alterado sem rastro | Impossível auditar ou desfazer | F2 nó 7, histórico append-only na mesma transação do update |
| 14 | Carrinho com itens de dois pontos | Pedido sem dono, ninguém prepara | F4 nó 3, `carrinho_misto` devolve 422 |
| 15 | Falha do WhatsApp cancela o pedido | Cliente perde a vaga por erro de infra | F4 nó 14, pedido persiste, falha vai para `notificacao_falha` e o painel do dono continua mostrando |
| 16 | Item com preço null entra na busca por "mais barato" | Ranking mentiroso, R$ 0,00 no topo | F1 nó 8 mantém `ativo = false`, e o front filtra `preco_brl != null` em toda ordenação por preço |

---

## Prompt de extração usado no nó `claude-vision` do F1

```
Você recebe a foto de um cardápio de um estabelecimento do campus da PUC-Rio.
Extraia SOMENTE o que está legível na imagem. Devolva JSON puro, sem texto fora do JSON.

Regras absolutas:
1. Dado que não está na foto é null. Nunca infira, nunca complete, nunca estime.
2. restricoes[] só recebe valor se o cardápio declarar em texto ("vegetariano", "sem glúten",
   "vegano", "sem lactose"). Nunca deduza pelo nome do prato. Sem declaração explícita,
   use ["desconhecido"].
3. descricao recebe o texto original do cardápio, exatamente como escrito, sem normalizar.
4. Item vendido por peso (self-service, comida a quilo, "R$ X / 100g", "por kg") NÃO é item.
   Marque preco_por_peso_detectado: true e deixe preco_brl null.
5. categoria só pode ser uma destas 12: prato_executivo, sanduiche_burger, salgado_padaria,
   pizza_massa, salada_bowl, sopa_caldo, porcao_acompanhamento, cafe_bebida_quente,
   bebida_fria, sobremesa_doce, combo_promocional, snack_embalado.
   Se nenhuma servir, use null e confianca: "baixa".
6. Preço com tamanhos (P/M/G, 300ml/500ml) gera um objeto por tamanho, com o tamanho em variacao.
7. Preço condicional ("aluno R$ 18, externo R$ 25") vai em preco_condicional como texto,
   e preco_brl recebe o menor valor claramente aplicável, ou null se ambíguo.
8. confianca: "alta" quando nome e preço estão nítidos e sem ambiguidade;
   "media" quando um dos dois exige leitura interpretativa;
   "baixa" quando há borrão, corte, rasura, preço riscado ou dúvida de qual preço pertence a qual item.

Formato de saída:
{"ponto_de_venda_detectado": string|null,
 "itens":[{"item","descricao","categoria","preco_brl","unidade_preco","variacao",
           "preco_condicional","restricoes","confianca","preco_por_peso_detectado",
           "trecho_original"}],
 "texto_ilegivel":[string],
 "observacoes":[string]}
```

`origem` é carimbado pelo n8n (`foto_real` quando vem do F1, `ficticio` quando vem de seed manual), nunca pelo modelo. `data_coleta`, `ponto_de_venda`, `horario_funcionamento` e `forma_de_pedido` também vêm do formulário de coleta, não da leitura da imagem.

---

## v5 — integrações para sair do protótipo (30/09/2026)

O `index.html` v5 já tem as telas e as regras; estes são os pontos em que o back-end substitui o navegador.

| Recurso no app v5 | Hoje (estático) | Com back-end |
|---|---|---|
| Login do aluno com ID PUC | Matrícula de 7 dígitos + senha (SHA-256 + sal) | SSO da PUC (OIDC/SAML) — matrícula vem do provedor, sem senha própria |
| Dados por loja | Filtro no app | Postgres/Supabase com **Row Level Security**: `restaurante_id = auth.restaurante_id()` em pedidos, chats, itens e log |
| Validação de afiliado | CNPJ (dígitos), código de e-mail exibido na tela, aprovação no painel PUC | E-mail transacional real; consulta de CNPJ; aprovação grava `aprovado_por` |
| Pix | BR Code estático com valor + txid; loja confirma | **F12 Pix:** PSP gera cobrança dinâmica (`txid` = código do pedido); webhook `pix.recebido` → `pagamento.status = pago` automaticamente |
| Mercado Pago | Link de pagamento da loja | **F13 MP:** Checkout Pro com `preference` de valor exato; webhook `payment.approved` → pago |
| WhatsApp | Links `wa.me` com mensagem pronta | **F4b:** WhatsApp Cloud API; template aprovado “pedido_pronto” disparado quando `status = pronto` (só se `whatsAvisos = true`) |
| Chat | `DB.chats` no navegador | Tabela `mensagem (restaurante_id, aluno_id, de, texto, em)` + canal realtime `chat:{restaurante}:{aluno}` |
| Aviso de pedido novo | Evento `storage` entre abas | Realtime `pedidos:{restaurante}` + Web Push |
| Capacidade de retirada | Conta pedidos por janela no navegador | Mesma regra dentro da transação do F4: `count(*) < capacidade_slot` ou 409 `slot_lotado` |
| Fac (persona) | Regras locais + Claude com chave do usuário | **F8** chama o Claude no servidor (chave nunca no navegador); mesma saída JSON validada |
| Painel PUC / engajamento | Calculado no navegador | View materializada `engajamento_restaurante` atualizada a cada hora; export CSV |
| Registro de atividades | `DB.log` (600 últimos) | Tabela `auditoria` append-only |

Novas barreiras de integridade:

| # | Falha possível | O que impede |
|---|---|---|
| 25 | Loja vê dados de outra loja | RLS por `restaurante_id` em todas as tabelas |
| 26 | Pedido marcado como pago sem pagamento | Só webhook assinado do PSP/MP muda para `pago` (loja pode marcar “pago no balcão” com log) |
| 27 | Horário de retirada acima da capacidade | Checagem de capacidade na mesma transação da reserva de estoque |
| 28 | IA sugere prato inexistente ou ignora restrição | Saída do Claude filtrada pelo vocabulário do cardápio; restrição rebaixa itens com palavra proibida no título/subtítulo |
| 29 | Afiliado falso | CNPJ + e-mail confirmado + aprovação PUC antes de aparecer |
