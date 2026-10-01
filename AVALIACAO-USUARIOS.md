# Avaliação de usuários — alunos e restaurantes

Recomendações da banca na última apresentação e como a v5 responde:

| Recomendação | Resposta na v5 | Próximo passo |
|---|---|---|
| Avaliar se o cadastro está validado; o estabelecimento ter segurança em usar apenas os seus dados | CNPJ com dígitos conferidos, código de e-mail, aprovação do gestor, escopo por loja, SHA-256 + sal, registro de atividades | Row Level Security no back-end |
| Falar com Felipe Rangel | — | Agendar conversa; levar o painel PUC e o CSV de engajamento |
| Avaliação de usuário: alunos e restaurantes | Pesquisa no app (NPS + 3 perguntas) → painel PUC | Rodar o roteiro abaixo |
| Dimensionar gargalo na retirada | Capacidade por janela de 15 min; horários lotados somem; painel de pico | Medir tempo real de entrega no balcão |
| Engajamento dos estabelecimentos nos novos contratos de concessão; painel da PUC | Perfil Gestor com ranking de engajamento (score 0–100) + CSV | Validar os pesos com a coordenação |

## Roteiro de teste — alunos (5 pessoas, 15 min cada)

1. “Crie sua conta.” → mede: tempo até a home. Depois: “Personalize seu gosto no Perfil” → as indicações mudaram e “fazem sentido” (0–10)?
2. “Você quer algo até R$ 25. Encontre e coloque no carrinho.” → mede: sucesso, cliques, uso da busca vs. lista.
3. “Pague com Pix e peça aviso no WhatsApp.” → entendeu o código, o kanban e o aviso?
4. “Pergunte à loja se tem hashi.” → acha o chat?
5. “Apague o histórico da conversa de busca.” → acha o botão?
6. Pesquisa no app (Perfil → Avaliar) + 1 pergunta aberta: “o que faria você usar isso amanhã?”

## Roteiro de teste — restaurantes (3 lojas, 20 min cada, no balcão)

1. “Cadastre sua loja e 3 itens com título e subtítulo.” → tempo, campos confusos.
2. Fazemos um pedido de outro aparelho/aba → a loja percebe o som e o aviso? Em quantos segundos?
3. “Confirme o Pix e marque como pronto; avise o aluno no WhatsApp.”
4. “Quantos pedidos vocês conseguem entregar a cada 15 minutos no almoço?” → calibra a capacidade.
5. Cronometrar 10 retiradas reais (chegada ao balcão → saída) → tempo médio de entrega.
6. Pesquisa no app (Loja → Avaliar) + “o que faria vocês desistirem?”

## Como dimensionar o balcão

`capacidade por janela = balcões atendendo × (15 min ÷ tempo médio de entrega em min)`.
Ex.: 1 atendente, 1,5 min por entrega → 10 por janela; usar 80% (8) como margem. No almoço (12h–14h, 8 janelas) = 64 pedidos pelo app.
