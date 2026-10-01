# 5.2 AI Log — FaculFood

Só as interações que mudaram a solução. Ferramenta: Claude (Cowork). As entradas 1–3 foram reconstruídas do `CONTINUAR.md`
da v4 (revisar e completar com a equipe); as entradas 4–14 são da construção da v5 (30/09/2026).

---

### 1. Base de dados do Caso 4 a partir das fotos (v1–v3, reconstituído)
- **Objetivo:** ter cardápios, preços e categorias sem dado pronto no repositório.
- **Contexto:** fotos dos cardápios de Cardeal, Na Medida, Soba Sushi, Vai um Strogonoff e Açaí do Wall.
- **Instrução:** transcrever itens, preços e categorias em estrutura de dados; não inventar item.
- **Resultado:** seed com 5 restaurantes e ~70 itens.
- **Validação:** conferência item a item com as fotos. *(equipe: registrar quem conferiu)*
- **Decisão:** a seed vira a base do app; em v5 foi exportada para `data/cardapios.json`.

### 2. Busca “O que comer agora?” sem inventar prato (v4, reconstituído)
- **Objetivo:** buscar por desejo em todos os restaurantes.
- **Contexto:** cardápios da seed; exigência de nunca sugerir item inexistente.
- **Instrução:** índice invertido palavra → itens, sinônimos, prefixo e erro de digitação.
- **Resultado:** busca em ~5 ms com 1000 restaurantes simulados.
- **Validação:** botão “Testar com 1000 restaurantes” e buscas manuais (“salmão”, “salm”, “estrogonofe”).
- **Decisão:** a IA só traduz a frase em filtros; o resultado sempre vem do cardápio.

### 3. Restrição alimentar só quando declarada (v4, reconstituído)
- **Objetivo:** evitar risco de saúde.
- **Decisão:** “vegetariano” só se escrito no cardápio (“Strogonoff de abobrinha” não conta).

---

### 4. Esclarecer pedidos ambíguos antes de codar
- **Objetivo:** entender “pagamento funcionando”, “mexer na quantidade inicial do carrinho” e “IA como persona”.
- **Contexto:** site estático no GitHub Pages, sem servidor.
- **Instrução:** Claude fez 3 perguntas de múltipla escolha antes de começar.
- **Resultado:** equipe escolheu Pix real (BR Code), carrinho começando em 0 e IA local + Claude opcional.
- **Validação:** respostas da própria equipe; depois a equipe acrescentou Mercado Pago, ID PUC e as recomendações da banca.
- **Decisão:** escopo da v5 fechado nessas escolhas (ver `ROTEIRO.md`).

### 5. Pix de verdade sem back-end
- **Objetivo:** pagamento que funcione num site estático.
- **Contexto:** especificação do BR Code (EMV) do Banco Central.
- **Instrução:** montar o payload TLV (chave, valor, nome, cidade, txid) e o CRC16-CCITT.
- **Resultado:** função `pixPayload()`.
- **Validação:** CRC comparado com o exemplo oficial do BCB (`…6304` → `1D3D`, bateu); QR gerado pelo app decodificado com OpenCV e CRC do texto lido conferido em Python.
- **Decisão:** Pix com QR real; a loja confirma o recebimento (confirmação automática fica para o back-end).

### 6. Registro de pacotes bloqueado → biblioteca de QR embutida
- **Objetivo:** desenhar o QR Code.
- **Contexto:** `npm`/`pip` bloqueados no ambiente.
- **Instrução:** procurar uma biblioteca já disponível localmente.
- **Resultado:** biblioteca QRCode de Kazuhiko Arase (MIT) encontrada dentro do npm e empacotada num único script.
- **Validação:** QR lido por decodificador independente; licença registrada em `THIRD-PARTY.md`.
- **Decisão:** QR 100% no navegador, sem CDN (funciona offline).

### 7. Senhas: de djb2 para SHA-256 com sal
- **Objetivo:** responder à banca sobre segurança do cadastro.
- **Instrução:** implementar SHA-256 síncrono e sal por conta.
- **Resultado:** `sha256()` + `hashSenha()`.
- **Validação:** hashes de “abc”, texto vazio e texto com acentos iguais aos do `hashlib` do Python.
- **Decisão:** todas as contas (aluno, loja, PUC) usam SHA-256 + sal.

### 8. Questionário de gostos → perfil → indicações
- **Objetivo:** indicar pratos e restaurantes coerentes com o que o aluno respondeu.
- **Instrução:** 4 perguntas (gostos, restrições, orçamento, momento) + texto livre interpretado por regras; negações (“não curto açaí”) viram “evitar”.
- **Resultado:** `entenderLocal()`, `combinaDet()` e tela “Indicado pra você” com o motivo.
- **Validação:** teste automatizado: respostas “Sushi, Saudável, Sem lactose, R$ 20–35, Almoço” + “amo salmão, mas não curto açaí” → perfil “gosta de sushi, salmão · evita açaí”.
- **Decisão:** mantido; palavras genéricas (“prato”, “lanche”) viram peso de persona, não gosto concreto.

### 9. Erro: o parser de frases ignorava as vírgulas
- **Objetivo:** separar “amo salmão, mas não curto açaí” em duas orações.
- **Resultado da IA:** o código dividia a frase por vírgula **depois** de normalizar o texto, e a normalização já removia a pontuação.
- **Validação:** revisão do código antes do teste.
- **Decisão:** dividir pela pontuação antes de normalizar.

### 10. Erro: formulário de afiliado perdia a senha
- **Objetivo:** cadastrar vários itens (título e subtítulo) na afiliação.
- **Resultado da IA:** ao tocar “+ Adicionar outro item”, a tela era redesenhada e a senha e o aceite dos termos sumiam, bloqueando o envio sem mensagem.
- **Validação:** teste ponta a ponta com Playwright travou em “Confirme seu e-mail”; diagnóstico mostrou validação HTML parada no campo de senha vazio.
- **Decisão:** guardar senha (só em memória) e aceite no rascunho do formulário.

### 11. Erro mais grave: vegetariano recebendo prato com frango
- **Objetivo:** respeitar restrições do questionário.
- **Resultado da IA:** a checagem de “evitar” olhava só o título do item. Um aluno vegetariano via “Salada caesar” (subtítulo: “alface, frango…”) com 99% de combinação.
- **Validação:** revisão das capturas de tela da home no modo desktop.
- **Decisão:** a checagem passou a incluir o subtítulo; com vegetariano, “Salada caesar” e “Bowl de frango” caíram para 41% e “Bowl vegano” subiu para 79%.

### 12. Claude opcional sem deixar a IA inventar
- **Objetivo:** usar o Claude na Fac quando o aluno tiver chave.
- **Instrução:** sistema pede só JSON (resposta, pesos, gostos, evita, restrições, orçamento) e lista os itens reais.
- **Validação:** teste com resposta simulada contendo “pizza” e uma restrição inventada → o app descartou os dois (não existem no cardápio/lista).
- **Decisão:** qualquer erro de rede ou JSON cai para a IA local com aviso.

### 13. Gargalo na retirada
- **Objetivo:** responder à banca.
- **Instrução:** capacidade por janela de 15 min por loja; horários lotados indisponíveis; painel com pico × capacidade.
- **Validação:** teste com capacidade 1 e um pedido no primeiro horário → opção desabilitada e o próximo horário selecionado.
- **Decisão:** capacidade definida pela loja (padrão 8) e editável.

### 14. Painel PUC e engajamento
- **Objetivo:** apoiar os contratos de concessão.
- **Instrução:** score 0–100 com pesos explícitos e exportação CSV.
- **Validação:** conferência manual dos componentes numa loja com pedidos de teste.
- **Decisão:** pesos são hipótese; calibrar com a PUC (ver `RELATORIO-FINAL.md`).

---

## Revisão da v5 (30/09/2026, segunda rodada)

### 15. Login como primeira tela e três perfis explícitos
- **Objetivo:** deixar claro se quem entra é cliente, restaurante ou gestor; quem já tem conta cai direto em “O que comer agora?”.
- **Instrução:** equipe pediu tela inicial de login com a escolha no topo, sem ID PUC e sem nome de usuário.
- **Resultado:** seletor Cliente · Restaurante · Gestor; cadastro só com e-mail e senha; sessão lembrada no aparelho.
- **Validação:** teste automatizado: recarregar a página mantém o cliente na home; nova aba abre já logada.
- **Decisão:** a sessão de cada aba continua separada (para testar cliente e loja lado a lado).

### 16. Erro: cards de “Indicado pra você” e “Em promoção” cortados
- **Resultado da IA (versão anterior):** carrossel horizontal com cards de largura fixa; no celular o último card ficava pela metade.
- **Validação:** apontado pela equipe; confirmado nas capturas.
- **Decisão:** grade responsiva (2/3/6 colunas) com 6 itens + “Ver mais”; teste mede que nenhum card passa da borda da tela (resultado: 0).

### 17. Perfil de gosto invisível para o cliente
- **Objetivo:** app limpo; o cliente não precisa saber como foi classificado.
- **Decisão:** removidos “% combina”, “porque você curte…”, barras e resumo do perfil. O questionário virou opcional, no fim do Perfil,
  com faixas de preço até R$ 20 · 20–35 · 35–50 · acima de 50.

### 18. Kanban e aviso de pronto no WhatsApp
- **Objetivo:** acompanhar o pedido em quadro (cliente e restaurante) e avisar no WhatsApp quando a comida ficar pronta.
- **Resultado:** quadro com colunas por status; arrastar e soltar no computador; ao marcar Pronto, abre o WhatsApp do cliente com a mensagem.
- **Validação:** teste arrastou o cartão de Pronto para Retirado (status mudou); ao clicar “Pronto →” abriu uma nova janela com o link `wa.me` do cliente.
- **Erro encontrado:** `window.open(..., "noopener")` sempre devolve `null`, então o app achava que o WhatsApp tinha sido bloqueado. Corrigido abrindo sem `noopener` e zerando `opener` em seguida.
- **Decisão:** envio sem toque só com a WhatsApp Cloud API (blueprint).

---

## v6 (30/09/2026)

### 19. “Paguei por Pix, mas aparece ‘a pagar’”
- **Objetivo:** o cliente saber em que pé está o pagamento.
- **Resultado da IA (v5):** o status só mudava se o cliente tocasse “Já paguei” na tela de confirmação; no quadro aparecia “A pagar”.
- **Validação:** apontado pela equipe no uso real.
- **Decisão:** “Já paguei” direto no cartão do pedido; rótulos “Aguardando pagamento” → “Pix enviado · loja confirmando” → “Pago ✓”. Teste automático confere os três estados.

### 20. Status com cores (cinza, vermelho, amarelo, verde)
- **Objetivo:** entender se a loja já está preparando.
- **Instrução:** novo status “Na fila” entre “Não confirmado” e “Em preparo”; mesmas cores no quadro do cliente e da loja, na pílula flutuante e nos selos.
- **Validação:** teste leva o pedido por todos os status na aba da loja e confere a aba do cliente.
- **Decisão:** a loja passa a **confirmar** o pedido (botão “Confirmar →”); pode recusar até começar o preparo.

### 21. Busca sem histórico
- **Decisão:** a busca guarda só a consulta atual em memória; nada é salvo na conta. Teste: 0 bolhas de conversa e 0 atalhos de buscas anteriores.

### 22. “Não sei em qual tela estou”
- **Decisão:** selo do perfil (Cliente/Restaurante/Gestor) com cor própria na barra superior e menu de conta.

### 23. Resultados do restaurante e avaliação dupla
- **Objetivo:** itens mais pedidos, horário de pico e avaliação do restaurante e do pedido.
- **Contexto:** sem histórico real, os gráficos nasceriam vazios.
- **Decisão:** gerador determinístico de pedidos de **demonstração** (marcados `demo:true`, fora do quadro do dia) com pico no almoço; gráficos de barras simples (uma cor, pico destacado, valor no pico e dica ao passar o mouse).
- **Validação:** conferido que Soba Sushi mostra pico às 13h e “Yakisoba de legumes” (item em promoção, mais peso no gerador) no topo.

---

## v7 (30/09/2026)

### 24. Roteiro do cliente sem desvio
- **Decisão:** cadastro leva direto à home; questionário vira filtro opcional (“O que você gosta?”). Histórico de pedidos some da interface e continua só no cálculo das indicações.

### 25. “Os desenhos estão infantis”
- **Contexto:** emojis grandes nos cards, abas e restaurantes.
- **Limitação encontrada:** o ambiente de construção não acessa bancos de fotos (Unsplash, Wikimedia e CDNs bloqueados), então não foi possível embutir fotos reais de pratos.
- **Decisão:** ícones de linha (SVG próprios), monogramas para restaurantes e **foto real tirada pelo próprio restaurante** em cada item (reduzida para ~20 KB no navegador).

### 26. Leitura de cardápio por foto
- **Instrução:** foto → texto → itens editáveis → publicar só o que o restaurante confirmar.
- **Resultado:** dois leitores: Claude (visão, JSON) com a chave da loja, ou OCR Tesseract.js carregado sob demanda; um parser transforma “Nome ..... 14,90” em item, linhas em maiúsculas em categoria e a linha seguinte em subtítulo.
- **Validação:** foto de cardápio gerada para teste; com o OCR simulado (sem internet no ambiente), o parser leu 4 itens com preço e categoria certos, inclusive “R$ 16,50” e o subtítulo “queijo coalho e orégano”.
- **Risco registrado:** o OCR real depende da qualidade da foto; por isso nada é publicado sem a tela de conferência.

### 27. Controle de estoque e desconto na tela inicial do restaurante
- **Validação:** teste clicou −1 e +10 (100 → 109), aplicou −20% e desligou/ligou a venda; tudo salvo e registrado no log.

### 28. Gestor “não funcionava”
- **Validação:** login testado com dados limpos funcionou; a causa provável eram dados antigos no navegador. A v7 usa chave de armazenamento nova e aceita `gestor` como login.
- **Decisão:** ranking alternável por vendas, por avaliação dos alunos e geral.

---

## v8 (30/09/2026)

### 29. “Paguei e não ficou confirmado”
- **Causa:** depois de “Já paguei” o pedido ficava “Pix enviado · loja confirmando” e o status do pedido continuava “Não confirmado” até a loja agir.
- **Decisão:** sem banco ligado ao protótipo, o pagamento informado pelo cliente passa a valer como **pago** e confirma o pedido (vai para “Na fila”); a loja tem “Não recebi” para desfazer. Cartão (simulado) confirma direto.
- **Validação:** teste automático: após “Já paguei”, pedido = `fila`, pagamento = `pago`.

### 30. Pedido solto na tela de busca
- **Decisão:** removida a faixa flutuante; o pedido aparece só em Acompanhar (com contador na aba). Teste: 0 faixas na home e na busca.

### 31. Contas próprias para restaurante e gestor
- **Decisão:** restaurante cria conta pelo formulário de interesse (sem cardápio); gestor cria conta com e-mail `@puc-rio.br` (e-mail externo é barrado — testado).
- **Infraestrutura:** nova visão do gestor com m², balcões, vendas/m² e pico do balcão. As áreas iniciais são **valores de exemplo** marcados na tela, para a equipe substituir pelos dados reais da PUC.

---

## v9 (30/09/2026)

### 32. Ajustes de interface pedidos pela equipe
- “Apagar minha conta” → **“Cancelar conta”**, sem destaque vermelho (o vermelho chamava atenção para uma ação que não queremos incentivar).
- Bloco “Avançado” removido do Perfil do cliente.
- Imagens de restaurante: as iniciais coloridas deram lugar à **foto enviada pela loja** ou, sem foto, ao ícone da culinária sobre uma cor por tipo de comida, com capa no cardápio.
- **Validação:** teste automático confirmou ausência do bloco Avançado, o rótulo e o estilo do botão, o envio da foto da loja (≈27 KB após redução) e o fluxo de cancelamento.

## v10 (30/09/2026)

### 33. Bases no gestor, alarme opcional e apresentações
- **Pedido da equipe:** a base de clientes e a base de restaurantes ficam com o gestor; o alarme vira opção marcada/desmarcada, sem “Testar”.
- **O que a IA fez:** criou `viewPucRestaurantes` (filtros, busca, aprovar/recusar/suspender, CSV) e `viewPucClientes` (resumo por cliente, CSV, nota de LGPD), juntou o NPS em Engajamento e trocou o botão “Testar” por uma caixa de seleção que grava `alarme` no usuário.
- **Pergunta da equipe — “a conexão funciona na vida real?”:** a IA não respondeu de memória; rodou um teste com cliente e loja em duas abas. Resultado: “Preparar” → cliente vê *preparando*; “Pronto” → cliente vê *pronto* e o alarme abre. Também deixou claro o limite: em celulares diferentes não sincroniza, porque os dados estão no `localStorage`. Precisa do back-end do blueprint.
- **Apresentações:** sprint de 17 slides adaptada da estrutura do modelo (visão, alternativas, banca, É/NÃO É, sequenciador, funcionalidades, jornadas com telas reais do app) e pitch de 30 s em 4 slides, com tempo e fala nas notas.
- **Cuidado para não inventar:** a pesquisa com usuários aparece como *planejada* (sem números); a matriz de alternativas está rotulada como avaliação qualitativa da equipe; os nomes da equipe ficaram como `[nomes da equipe]`.
- **Validação:** teste automático (alarme marcado por padrão, sem “Testar”, desmarcar grava `false`; base com 9 restaurantes; CSVs de restaurantes e clientes baixados; nenhum erro de JavaScript). As duas apresentações passaram no validador de .pptx e foram revisadas renderizadas.

### 34. Pergunta em uma linha e sprint mais enxuta
- **Pedido da equipe:** trocar a pergunta da tela inicial por uma versão que caiba em uma linha, em tudo que foi produzido; tirar da sprint os slides de sequenciador e pesquisa de usuário.
- **O que a IA fez:** trocou para **“O que comer agora?”** no app, nos documentos e nas apresentações; deixou o título sem quebra de linha e com tamanho que se ajusta à largura da tela; refez as telas usadas nos slides; removeu os dois slides (a sprint ficou com 15).
- **Validação:** teste automático mediu o título em 320, 360, 390, 768 e 1280 px de largura: uma linha, sem corte. Fluxo cliente ↔ loja e bases do gestor repetidos sem erros; as duas apresentações passaram no validador.

## v11 (30/09/2026)

### 35. Entrada sempre pelo login e filtros em uma linha
- **Pedido da equipe:** “a tela já vem logada” — a entrada padrão deve ser entrar ou criar perfil; abaixo de “O que comer agora?” havia filtros demais, ocupando duas linhas.
- **O que a IA fez:** removeu o login lembrado no aparelho (`faculfood_v8_lembrar`) e passou a limpar a sessão ao abrir o app; a sessão continua valendo só na aba enquanto ela está aberta, então o teste cliente/loja em duas abas segue funcionando. Os filtros viraram **os 3 mais pedidos**, calculados pela contagem dos itens nos pedidos, com linha única e sem quebra.
- **Decisão consciente:** recarregar a página também volta ao login. É o comportamento pedido (“tela padrão de entrada”); a contrapartida é ter de entrar de novo.
- **Validação:** teste automático em 320, 390 e 1280 px: abre em `entrada`, 3 filtros numa linha sem corte, recarregar volta a `entrada`; fluxo cliente ↔ loja, alarme e bases do gestor repetidos sem erros.

