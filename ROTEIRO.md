# 5.1 Roteiro — FaculFood v5

Equipe: [nomes da equipe — até 4 pessoas] · Caso principal: **4 — Restaurantes integrados** · Data: 30/09/2026

## Entendimento

Na hora do almoço, o aluno da PUC-Rio perde tempo em fila e não sabe o que cada restaurante do campus tem nem quanto custa.
Os restaurantes não têm um canal digital para receber pedido, cobrar e avisar que está pronto, e a PUC não tem visibilidade
de quanto cada concessionário engaja os alunos. Não existe dado pronto: os cardápios estão em quadros e papéis.

O FaculFood junta cardápios, preços e pedidos num só lugar, **só para retirada no balcão**: o aluno diz o que quer comer,
paga, recebe um código e retira sem fila. O restaurante recebe o pedido, confirma o pagamento e avisa. A PUC acompanha tudo num painel.

## Escopo

**Obrigatório (v5)**
- Primeira tela = login com Cliente · Restaurante · Gestor; depois do login o cliente cai em “O que comer agora?”; app responsivo e sem textos explicativos.
- Cadastro só com e-mail e senha; personalização de gosto opcional no fim do Perfil → indicações coerentes (perfil invisível ao cliente).
- Pedidos em kanban para cliente e restaurante; aviso no WhatsApp quando ficar pronto.
- Carrinho começando em 0; um restaurante por pedido; horário de retirada com capacidade.
- Pagamento que funciona: Pix (BR Code válido) e Mercado Pago (link); cartão simulado.
- Chat aluno ↔ loja e acompanhamento por WhatsApp.
- Apagar histórico da conversa “O que comer agora?”.
- Restaurante: afiliação com itens (título e subtítulo), aba Pedidos com aviso de pedido novo, adicionar itens.
- Recomendações da banca: cadastro validado e seguro, avaliação de usuários, dimensionamento da retirada, painel da PUC de engajamento.
- Documentação: README reproduzível, Roteiro, AI Log, Relatório final, roteiro do vídeo.

**Desejável**
- IA de persona com Claude (opcional, chave do usuário).
- Instalar na tela inicial (PWA) e modo offline.
- Registro de atividades (auditoria) e exportação CSV do engajamento.

**Fora do escopo**
- Entrega (só retirada), back-end real, SSO real da PUC, confirmação automática de Pix/Mercado Pago, envio automático no WhatsApp.
- Dados de outros casos ou fontes externas.

## Decisões técnicas

| Tema | Decisão | Por quê |
|---|---|---|
| Stack | HTML + CSS + JS puro, 1 arquivo | Roda no GitHub Pages sem build; qualquer pessoa replica |
| Dados | Cardápios reais das fotos + 4 afiliados de exemplo marcados; `data/cardapios.json` | Caso 4 não tem dado pronto |
| Persistência | `localStorage` (dados) + `sessionStorage` (sessão por aba) | Permite testar aluno e loja em duas abas |
| Pix | BR Code EMV gerado no navegador + QR (lib MIT embutida) | Pagamento real sem servidor; confirmação pela loja |
| Mercado Pago | Link de pagamento da loja | Funciona sem back-end |
| WhatsApp | Links `wa.me` com mensagem pronta | Sem API paga; envio automático fica no blueprint |
| IA de persona | Motor local de regras + Claude opcional com saída JSON validada | Sempre funciona; nunca inventa prato |
| Segurança | SHA-256 + sal, escopo por loja, validação de CNPJ, aprovação da PUC, log | Resposta direta à banca |

Estrutura: `render()` desenha a tela atual a partir de `view`; um único ouvinte de eventos (`data-act`) trata cliques;
três perfis (aluno, restaurante, PUC) com abas próprias e telas permitidas por perfil.

## Decomposição

1. Casca de app: barra superior, abas inferiores, carrinho flutuante, PWA.
2. Entrada: login com Cliente · Restaurante · Gestor; cadastro por e-mail; seja afiliado.
3. Questionário de gostos → perfil → indicações; conversa com a Fac; Claude opcional.
4. Carrinho em 0 e checkout com capacidade de retirada.
5. Pix BR Code + QR, Mercado Pago, cartão com Luhn.
6. Chat aluno ↔ loja + WhatsApp + mensagens automáticas de status.
7. Afiliação com itens, validação e aprovação PUC; aba Pedidos com alerta; adicionar/colar itens.
8. Painel PUC: validação, engajamento, gargalo, avaliação de usuários, log.
9. Testes ponta a ponta (Playwright) e documentação.

## Critérios de aceite

- [x] Primeira tela é o login com Cliente · Restaurante · Gestor; o app sempre abre nela (v11).
- [x] Nenhum card de “Indicado pra você”/“Em promoção” passa da borda da tela.
- [x] Pedido arrastado no kanban muda de status; “Pronto” abre o WhatsApp do cliente.
- [x] Item no cardápio mostra só “+” (0 no carrinho); um toque → 1.
- [x] Questionário gera perfil e as indicações respeitam o que foi respondido (ex.: “evita açaí” derruba açaí; vegetariano derruba itens com carne no título ou subtítulo).
- [x] QR Pix lido por um leitor de QR e CRC16 conferido; valor = total do pedido.
- [x] Pedido feito numa aba aparece na aba Pedidos da loja com som/aviso; “Pronto” toca o alarme do aluno.
- [x] Chat funciona nos dois sentidos; “Apagar histórico” zera a conversa da busca.
- [x] Afiliado com CNPJ inválido é barrado; válido fica pendente até a PUC aprovar.
- [x] Horário lotado não pode ser escolhido.
- [x] Nenhum erro de JavaScript no roteiro completo de teste.

## Estratégia de IA

- **Claude na construção:** leitura do código v4 e da proposta, perguntas de esclarecimento antes de codar (pagamento, quantidade, tipo de IA),
  geração do código por módulos, testes automatizados de ponta a ponta e revisão de capturas de tela.
- **Validação humana e independente:** CRC do Pix contra o exemplo oficial do BCB; SHA-256 contra o `hashlib` do Python; QR decodificado com OpenCV;
  capturas de tela revisadas uma a uma.
- **Claude no produto:** opcional na Fac, restrito a devolver JSON com pesos/gostos; o app filtra tudo o que não existe nos cardápios.
