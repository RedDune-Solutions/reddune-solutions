// RedDune Dashboard — Mock Data
// Algarve/Fuseta · IT, electronics, web for a one-person operation

window.RDB_DATA = (function(){

const today = new Date('2026-05-12');
const d = (offset) => { const x = new Date(today); x.setDate(x.getDate()+offset); return x.toISOString().slice(0,10); };
const t = (offset, h=10, m=0) => { const x = new Date(today); x.setDate(x.getDate()+offset); x.setHours(h,m,0,0); return x.toISOString(); };

const clients = [
  { id:'c1', name:'João Marques', tag:'B2C', email:'joao.marques@gmail.com', phone:'+351 916 482 217', address:'Rua da Liberdade 14, Olhão', notes:'Cliente recorrente desde 2024. Tem iPhone 12 e MacBook Air M1.', since:'2024-03', tags:['recorrente'] },
  { id:'c2', name:'Sofia Almeida', tag:'B2C', email:'sofia.almeida@hotmail.com', phone:'+351 962 045 119', address:'Av. dos Pescadores 8, Fuseta', notes:'Trabalha em remoto, urgente quando precisa.', since:'2025-01', tags:['urgente'] },
  { id:'c3', name:'Café Maré Alta', tag:'B2B', email:'gerente@marealta.pt', phone:'+351 289 793 010', address:'Largo da Igreja 2, Fuseta', notes:'Wi-Fi + PoS Sumup. Contrato de manutenção mensal €45.', since:'2024-11', tags:['contrato','b2b'] },
  { id:'c4', name:'Restaurante Cabana', tag:'B2B', email:'reservas@cabana-fuseta.pt', phone:'+351 289 794 562', address:'Cais da Fuseta, Fuseta', notes:'Refez o site em Out/2025. Domínio: cabana-fuseta.pt', since:'2025-08', tags:['web','b2b'] },
  { id:'c5', name:'Miguel Costa', tag:'B2C', email:'mcosta1988@outlook.pt', phone:'+351 933 102 488', address:'Rua do Sol 5, Moncarapacho', notes:'Recuperação de fotos do casamento — disco WD 1TB.', since:'2026-04', tags:['data'] },
  { id:'c6', name:'Ana Ferreira', tag:'B2C', email:'anaf@gmail.com', phone:'+351 919 822 410', address:'Tavira', notes:'iMac 2019 — barulho a ligar.', since:'2026-03', tags:[] },
  { id:'c7', name:'Studio Salgado', tag:'B2B', email:'hello@studiosalgado.pt', phone:'+351 916 005 221', address:'Faro', notes:'Site institucional + booking. Renovação anual €380.', since:'2025-05', tags:['web','b2b','recorrente'] },
  { id:'c8', name:'Rui Tavares', tag:'B2C', email:'ruitavaresxd@gmail.com', phone:'+351 968 471 023', address:'Olhão', notes:'PS5 não liga — fonte queimada.', since:'2026-05', tags:[] },
  { id:'c9', name:'Pastelaria Mané', tag:'B2B', email:'mane.pastelaria@gmail.com', phone:'+351 289 793 887', address:'Fuseta', notes:'Caixa registadora antiga. Manutenção pontual.', since:'2025-09', tags:['b2b'] },
  { id:'c10', name:'Helena Brito', tag:'B2C', email:'h.brito@sapo.pt', phone:'+351 925 100 884', address:'Tavira', notes:'Aulas básicas de informática 1×/sem. €25/h.', since:'2025-11', tags:['recorrente'] },
];

const tasks = [
  { id:'t1', title:'Substituição de ecrã iPhone 12', clientId:'c1', status:'prog', priority:'normal', service:'assistencia', due:d(2), price:120, paid:false, paymentId:'p1', created:d(-3),
    desc:'Cliente trouxe iPhone 12 com vidro partido após queda. Touch funcional. Ecrã original encomendado dia 9, chega amanhã.',
    checklist:[{t:'Diagnóstico',d:true},{t:'Encomendar peça (iFixit)',d:true},{t:'Substituir ecrã',d:false},{t:'Testar Face ID',d:false},{t:'Limpar e entregar',d:false}],
    activity:[
      {when:t(-3,11,20),what:'Tarefa criada — diagnóstico inicial 30€'},
      {when:t(-3,14,5),what:'Peça encomendada via iFixit EU (€68 + €12 envio)'},
      {when:t(-1,9,30),what:'Estado → Em curso. Cliente avisado por WhatsApp.'},
    ] },
  { id:'t2', title:'Recuperação de fotos — disco WD 1TB', clientId:'c5', status:'prog', priority:'urgent', service:'software', due:d(1), price:160, paid:false, paymentId:'p2', created:d(-5),
    desc:'Disco externo cai do estojo, deixou de montar. Cliente perdeu fotografias do casamento (Ago/2025). Tentativa com PhotoRec, recuperados ~12 GB. A reconstruir índice.',
    checklist:[{t:'Avaliar estado físico',d:true},{t:'Clone com ddrescue',d:true},{t:'PhotoRec',d:true},{t:'Recuperar estrutura de pastas',d:false},{t:'Entregar em SSD novo',d:false}],
    activity:[
      {when:t(-5,16,10),what:'Receção do disco — avaliação +30€'},
      {when:t(-4,9,0),what:'Iniciado clone ddrescue (12h estimadas)'},
      {when:t(-2,18,42),what:'PhotoRec terminou: 4.318 ficheiros recuperados'},
    ] },
  { id:'t3', title:'Wi-Fi cai 3×/dia — Café Maré Alta', clientId:'c3', status:'wait', priority:'normal', service:'assistencia', due:d(0), price:0, paid:true, paymentId:null, created:d(-1),
    desc:'Cliente em plano de manutenção (€45/mês). Wi-Fi instável durante o serviço de almoço. Suspeita: AP barato. Proposto trocar para TP-Link EAP610.',
    checklist:[{t:'Visita técnica',d:true},{t:'Identificar interferência',d:true},{t:'Propor solução €110',d:true},{t:'Aguarda aprovação',d:false}],
    activity:[
      {when:t(-1,15,0),what:'Visita técnica — 1h coberta pelo plano'},
      {when:t(-1,16,30),what:'Proposta enviada por email'},
    ] },
  { id:'t4', title:'Site novo — Restaurante Cabana (revisão)', clientId:'c4', status:'todo', priority:'normal', service:'web', due:d(8), price:280, paid:false, paymentId:'p4', created:d(-2),
    desc:'Cliente pediu nova secção de menu sazonal + galeria de pratos. Atualizar fotos do pôr-do-sol que ficaram escuras.',
    checklist:[{t:'Reunião briefing',d:true},{t:'Desenhar menu sazonal',d:false},{t:'Otimizar imagens',d:false},{t:'Deploy',d:false}],
    activity:[{when:t(-2,11,0),what:'Reunião por WhatsApp — confirmado escopo'}] },
  { id:'t5', title:'PS5 não liga — diagnóstico', clientId:'c8', status:'todo', priority:'normal', service:'assistencia', due:d(4), price:0, paid:false, paymentId:null, created:d(-1),
    desc:'PS5 fat, nem LED acende. Cliente disse que houve trovoada. Diagnóstico 25€ se não avançar reparação.',
    checklist:[{t:'Diagnóstico',d:false},{t:'Orçamento para cliente',d:false}],
    activity:[{when:t(-1,17,30),what:'Receção da consola'}] },
  { id:'t6', title:'iMac 2019 — barulho ao ligar', clientId:'c6', status:'todo', priority:'normal', service:'assistencia', due:d(6), price:55, paid:false, paymentId:'p6', created:d(0),
    desc:'Provável ventoinha CPU. Pedir peça se confirmar diagnóstico.',
    checklist:[{t:'Diagnóstico',d:false}],
    activity:[{when:t(0,9,20),what:'Tarefa criada'}] },
  { id:'t7', title:'Manutenção mensal — Studio Salgado', clientId:'c7', status:'done', priority:'normal', service:'web', due:d(-1), price:80, paid:true, paymentId:'p7', created:d(-3),
    desc:'Backups, atualizações, monitorização. Tudo OK este mês.',
    checklist:[{t:'Backup',d:true},{t:'Atualizações',d:true},{t:'SSL check',d:true},{t:'Relatório',d:true}],
    activity:[
      {when:t(-3,9,0),what:'Iniciado ciclo mensal'},
      {when:t(-1,17,0),what:'Relatório enviado ao cliente'},
    ] },
  { id:'t8', title:'Aula 1×1 — Helena Brito (gestão fotos iCloud)', clientId:'c10', status:'done', priority:'low', service:'software', due:d(-2), price:25, paid:true, paymentId:'p8', created:d(-2),
    desc:'1 hora — organização de fotos por álbuns, eliminar duplicados.',
    checklist:[{t:'Aula realizada',d:true}],
    activity:[{when:t(-2,15,0),what:'Aula concluída'}] },
  { id:'t9', title:'PoS Sumup — atualização firmware', clientId:'c3', status:'done', priority:'normal', service:'assistencia', due:d(-4), price:0, paid:true, paymentId:null, created:d(-5),
    desc:'Plano de manutenção. Atualização rápida 20min.',
    checklist:[{t:'Atualização',d:true}],
    activity:[{when:t(-4,11,0),what:'Concluído no local'}] },
  { id:'t10', title:'Aulas semanais — Helena (próxima)', clientId:'c10', status:'todo', priority:'low', service:'software', due:d(5), price:25, paid:false, paymentId:null, created:d(0),
    desc:'Agendar tópico desta semana. Sugestão: WhatsApp Web e segurança de password.',
    checklist:[], activity:[] },
  { id:'t11', title:'Caixa registadora não imprime — Pastelaria Mané', clientId:'c9', status:'todo', priority:'urgent', service:'assistencia', due:d(0), price:45, paid:false, paymentId:'p11', created:d(0),
    desc:'Caixa antiga Sweda — provável rolo papel ou cabeça térmica suja. Visita marcada esta tarde.',
    checklist:[{t:'Visita',d:false}],
    activity:[{when:t(0,8,15),what:'Pedido por WhatsApp'}] },
  { id:'t12', title:'Backup automático — Sofia Almeida', clientId:'c2', status:'wait', priority:'normal', service:'software', due:d(3), price:90, paid:false, paymentId:'p12', created:d(-2),
    desc:'Configurar Time Machine + backup off-site em NAS Synology DS220+. À espera que cliente compre o DS220+ (orçamento enviado).',
    checklist:[{t:'Orçamento NAS',d:true},{t:'Aguarda compra do equipamento',d:false},{t:'Configuração',d:false}],
    activity:[{when:t(-2,14,0),what:'Orçamento enviado'}] },
];

const payments = [
  { id:'p1', taskId:'t1', clientId:'c1', amount:120, status:'pending', method:'mbway', issued:d(-3), due:d(2), note:'A receber na entrega.' },
  { id:'p2', taskId:'t2', clientId:'c5', amount:160, status:'pending', method:'mbway', issued:d(-5), due:d(1), note:'30€ avaliação adiantada já paga.' },
  { id:'p4', taskId:'t4', clientId:'c4', amount:280, status:'pending', method:'transferencia', issued:d(-2), due:d(8) },
  { id:'p6', taskId:'t6', clientId:'c6', amount:55, status:'pending', method:'numerario', issued:d(0), due:d(6) },
  { id:'p7', taskId:'t7', clientId:'c7', amount:80, status:'paid', method:'transferencia', issued:d(-3), due:d(-1), paidOn:d(-1) },
  { id:'p8', taskId:'t8', clientId:'c10', amount:25, status:'paid', method:'numerario', issued:d(-2), due:d(-2), paidOn:d(-2) },
  { id:'p11', taskId:'t11', clientId:'c9', amount:45, status:'pending', method:'numerario', issued:d(0), due:d(2) },
  { id:'p12', taskId:'t12', clientId:'c2', amount:90, status:'pending', method:'mbway', issued:d(-2), due:d(7) },
  { id:'p20', taskId:null, clientId:'c3', amount:45, status:'paid', method:'transferencia', issued:d(-30), due:d(-30), paidOn:d(-29), note:'Plano manutenção Abril' },
  { id:'p21', taskId:null, clientId:'c3', amount:45, status:'paid', method:'transferencia', issued:d(-2), due:d(-2), paidOn:d(-1), note:'Plano manutenção Maio' },
  { id:'p22', taskId:null, clientId:'c10', amount:25, status:'overdue', method:'mbway', issued:d(-14), due:d(-7), note:'Aula 28/Abr — esquecida' },
  { id:'p23', taskId:null, clientId:'c7', amount:380, status:'paid', method:'transferencia', issued:d(-180), due:d(-178), paidOn:d(-177), note:'Renovação anual 2025' },
];

const notes = [
  { id:'n1', title:'Procedimento — Diagnóstico de PS5 sem energia', folder:'Procedimentos', tags:['assistencia','playstation'], updated:d(-7),
    body:`Checklist rápida quando um PS5 não dá sinal de vida.

### Etapas
1. **Cabo / tomada** — testar noutra tomada. Cabo de teste conhecido.
2. **Botão liga** — segurar 7s para ciclo de reset.
3. **Fonte interna** — abrir caixa, medir 12V no conector. Se <11.5V → fonte queimada.
4. **APU** — se fonte OK, suspeitar APU. Pedir orçamento de reballing (raramente vale a pena vs. consola usada).

### Materiais comuns
- Chave [[ferramenta-toolkit-essential]] 
- Multímetro
- Pasta térmica MX-4

### Notas
Trovoadas e picos de tensão são causa #1 no Algarve em Maio/Outubro. Sugerir UPS quando relevante.
Ver também: [[t-pricing-reparacoes]]` },

  { id:'n2', title:'Pricing — Reparações de hardware', folder:'Pricing', tags:['precos'], updated:d(-3),
    body:`Tabela de referência interna. Atualizar a cada 6 meses ou quando peças oscilarem >10%.

### Smartphones
- Substituição ecrã iPhone 11–13: **120 €** (peça incluída)
- Substituição bateria iPhone 8–13: **55 €**
- Substituição ecrã Android (médio): **70–100 €**

### Computadores
- Limpeza interna + pasta térmica: **35 €**
- Substituição SSD + clone: **65 €** (sem disco)
- Substituição teclado MacBook: **a partir de 130 €** (peça)

### Consolas
- Diagnóstico PS5/Xbox: **25 €** (descontados se reparar)
- Limpeza completa PS5: **45 €**
- Substituição fonte PS5: **80 €** + peça

### Notas
Diagnóstico não-cobrado para clientes com plano de manutenção.
Ver: [[procedimento-ps5]]` },

  { id:'n3', title:'Clientes B2B com contrato', folder:'Clientes', tags:['b2b','contratos'], updated:d(-1),
    body:`Contratos de manutenção mensais (correr a cada início de mês).

| Cliente | Plano | Valor | Próximo |
|---|---|---|---|
| Café Maré Alta | Básico (1h + remoto) | 45 € | 1/Jun |
| Studio Salgado | Web (backup + sec) | 80 € | 1/Jun |
| Pastelaria Mané | Pontual | — | — |

### Lembretes
- Fatura recibos no dia 1, recebimento até dia 10.
- [[procedimento-faturacao]] tem o template Faturalia.
- Renovação anual Studio Salgado: **5 Nov 2026** — €380.` },

  { id:'n4', title:'Procedimento — Recuperação de dados', folder:'Procedimentos', tags:['software','dados'], updated:d(-5),
    body:`Sequência segura ao receber um disco com dados sensíveis.

### Antes de tocar no disco
1. Pedir ao cliente o **estado físico exato** (caiu? não monta? barulho?).
2. Estimar gravidade: ruído mecânico = NUNCA ligar mais. Encaminhar para câmara limpa (Recuperar.pt, Lisboa).
3. Receber por escrito (WhatsApp basta) que ficheiros são prioritários.

### Procedimento
1. **Imagem completa** com \`ddrescue\` (\`sudo ddrescue -d -r3 /dev/sdX clone.img log\`).
2. Nunca trabalhar no original. Sempre na imagem clonada.
3. **PhotoRec** ou **TestDisk** consoante caso.
4. Entregar em SSD novo (cobrar 25€ + custo do SSD).

### Preços
Ver [[t-pricing-reparacoes]]. Avaliação 30€ não-reembolsável.` },

  { id:'n5', title:'Roadmap — Loja online', folder:'Negócio', tags:['negocio','loja'], updated:d(-12),
    body:`Hoje é só lista de equipamentos. Quero passar a loja efetiva ao longo de 2026.

### Fase 1 (Maio)
- [x] Lista de stock no Notion
- [x] Página /loja no site novo (Oasis)
- [ ] WhatsApp como canal de encomenda

### Fase 2 (Verão)
- Carrinho simples no site (Next + Stripe?)
- Categorias: cabos · acessórios · refurbished
- Frete: levantamento gratuito Fuseta/Olhão, CTT Expresso

### Fase 3 (Q4 2026)
- Refurbished com selo 6 meses garantia
- Trade-in (recolher equipamento em troca de €)

### Bloqueios
- Espaço físico para stock — caixas no quarto não escalam` },

  { id:'n6', title:'Diário — Maio 2026', folder:'Diário', tags:['diario'], updated:d(0),
    body:`### 12 Mai (hoje)
- iPhone 12 do João: peça chega amanhã, montagem quinta
- Pastelaria Mané: visita à tarde (caixa registadora)
- Email Sofia: orçamento NAS — recordar

### 11 Mai
- Wi-Fi Café Maré Alta: visita técnica, propus EAP610. €110.
- Studio Salgado: ciclo manutenção fechado, relatório enviado.

### 10 Mai
- PS5 do Rui Tavares recebida. Diagnóstico amanhã.

### Pendências mentais
- Comprar pasta térmica MX-4 (acabou)
- Marcar inspeção carrinha
- Atualizar página /portfolio com case Studio Salgado` },

  { id:'n7', title:'Ferramenta toolkit — essencial', folder:'Procedimentos', tags:['ferramentas'], updated:d(-20),
    body:`O que tenho sempre na bancada e na mochila.

### Bancada
- Estação solda Hakko FX-888D
- Multímetro Fluke 117
- Microscópio AmScope 7x–45x
- Pasta térmica Arctic MX-4
- Set chaves iFixit Pro Tech

### Mochila (visitas)
- Pendrive Ventoy (16GB) com Linux Mint, Windows PE, MacRecovery, MemTest86
- Cabo USB-C/Lightning/MicroUSB
- Multitester pequeno
- 2× SSD externos (1× backup + 1× livre)
- Cabo de rede 5m + tester RJ45` },

  { id:'n8', title:'Procedimento — Faturação', folder:'Procedimentos', tags:['faturacao','negocio'], updated:d(-2),
    body:`### Software
Faturalia (€8/mês). Categorias: 'Serviços técnicos', 'Manutenção', 'Material'.

### Workflow
1. No fim do trabalho, criar Recibo Verde no Faturalia.
2. Enviar PDF + MBWay para cliente B2C, transferência para B2B.
3. Lançar na dashboard como [[pagamento]] com estado pending.
4. Marcar pago quando confirmado no banco.

### IVA
Regime de isenção art. 53º — abaixo dos €15.000 anuais. Validar todos os anos em Janeiro.` },
];

return { clients, tasks, payments, notes, today: '2026-05-12' };
})();
