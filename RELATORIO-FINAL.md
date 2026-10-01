# 5.3 Relatório final — FaculFood v11

**O que foi entregue?**
Um app web instalável (PWA), publicado no GitHub Pages, com três perfis:
- **Cliente:** login como primeira tela (Cliente · Restaurante · Gestor), cadastro só com e-mail e senha, “O que comer agora?” com
  indicações por perfil de gosto (invisível para o cliente, personalizável no fim do Perfil), grade responsiva sem cortes, carrinho começando em 0,
  acompanhamento do pedido com cores (não confirmado · na fila · em preparo · pronto), alarme em tela cheia, aviso no WhatsApp, Pix real (BR Code),
  Mercado Pago, “Converse com o estabelecimento” e avaliação do restaurante e do pedido.
- **Restaurante:** tela inicial “Itens à venda” (estoque oferecido, desconto, foto do item), leitura do cardápio por foto, pedidos no mesmo quadro do cliente, afiliação (e-mail, senha e nº de cadastro PUC; itens com título e subtítulo), aba Resultados (itens mais pedidos e horário de pico), validação (e-mail, aprovação PUC), pedidos em kanban com arrastar e soltar e aviso sonoro, WhatsApp aberto ao marcar Pronto,
  adicionar/colar itens, confirmação de pagamento, chat, aviso no WhatsApp, registro de atividades.
- **Gestor (PUC-Rio):** conta própria, base de restaurantes e base de clientes com exportação CSV, restaurantes mais engajados por vendas e por avaliação dos alunos (CSV), infraestrutura utilizada (m², balcões, vendas/m²), análise de interesses de afiliação, validação de afiliados, gargalo na retirada, avaliação de usuários (NPS) e auditoria.
O app sempre abre no login/criar conta; a busca mostra só os 3 filtros mais pedidos, em uma linha. Alarme de pronto opcional no Perfil do cliente. Apresentações de sprint e pitch de 30 s em `apresentacoes/`.
Limite atual: cliente e loja sincronizam no mesmo navegador (abas); entre celulares diferentes é preciso o back-end do blueprint.
Mais a base construída (`data/cardapios.json`, 9 restaurantes, 97 itens) e a documentação do processo.

**O que ficou de fora, por decisão consciente?**
Entrega; back-end real (os dados ficam no navegador); ID PUC/SSO (a equipe decidiu cadastro só com e-mail); confirmação automática de Pix/Mercado Pago (exige PSP e webhook);
envio automático no WhatsApp (exige Cloud API paga). Tudo está desenhado no `blueprint-n8n.md`.

**As 3 principais decisões técnicas**
1. **Site estático de um arquivo** — qualquer pessoa replica em 1 minuto; o custo é não ter multiusuário real.
2. **Pagamento real sem servidor via BR Code** — o QR é aceito por qualquer banco; a loja confirma o recebimento.
3. **IA que só filtra, nunca inventa** — a Fac (local ou Claude) devolve pesos e palavras; o app só aceita o que existe nos cardápios.

**Maior erro produzido pela IA e como foi corrigido**
A checagem de restrições olhava só o título do item. Um aluno vegetariano recebia “Salada caesar” (subtítulo com frango) com 99% de combinação.
Foi identificado na revisão das capturas de tela e corrigido incluindo o subtítulo na checagem; o caso virou teste (AI Log, entrada 11).

**Parte menos confiável**
As restrições alimentares: são inferidas por palavras do título/subtítulo e podem falhar (ex.: “molho da casa” com lactose).
Por isso o app só **rebaixa** itens suspeitos e só marca “vegetariano/vegano” quando a loja declara. Também é hipótese o score de engajamento (pesos não calibrados).

**Com mais duas horas, as 3 próximas prioridades**
1. Rodar o teste de usabilidade com 5 alunos e 3 restaurantes (`docs/AVALIACAO-USUARIOS.md`) e medir o tempo real de entrega no balcão para calibrar a capacidade.
2. Subir o back-end mínimo (Supabase com Row Level Security por restaurante) para aluno e loja usarem aparelhos diferentes.
3. Conversar com Felipe Rangel e a coordenação sobre SSO da PUC e os critérios de engajamento para os contratos de concessão.

**Outras ferramentas de IA além do Claude**
Nenhuma. *(equipe: completar se houver)*
