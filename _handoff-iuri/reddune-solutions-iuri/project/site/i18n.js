/* RedDune Solutions — i18n (PT ↔ EN)
   Single-file translation layer. Walks text nodes + selected attributes
   and swaps via a PT→EN dictionary. Re-runs on DOM mutations so dynamic
   content (loja products etc.) is also translated.
   Default lang: PT. Toggle via injected button in <nav.top>. Persisted in
   localStorage.
*/
(function () {
  const STORAGE_KEY = 'rds-lang';
  const DEFAULT_LANG = 'pt';

  // Dictionary — keyed by trimmed PT text. Values: { en: '...' }.
  // Add new strings here. Whitespace/newlines around the text node are
  // preserved automatically.
  const DICT = {
    // ─── NAV ───────────────────────────────────────────────
    'Serviços': 'Services',
    'Portfólio': 'Portfolio',
    'Loja': 'Shop',
    'Contactar': 'Contact',
    'Início': 'Home',

    // ─── HOMEPAGE — HERO ──────────────────────────────────
    'A resposta': 'The right',
    'certa': 'answer',
    '.': '.',
    'Para qualquer problema.': 'For any problem.',
    'Soluções informáticas personalizadas para particulares e empresas — assistência técnica, web e recuperação de dados. Com a confiança, eficiência e transparência que esperas.':
      'Tailored IT solutions for individuals and businesses — technical support, web and data recovery. With the trust, efficiency and transparency you expect.',
    'Ver serviços': 'See services',
    'Visitar loja': 'Visit shop',

    // ─── HOMEPAGE — TRUSTED STRIP ─────────────────────────
    '/ para quem trabalhamos': '/ who we work for',
    'Particulares': 'Individuals',
    'Empresas': 'Businesses',
    'Qualquer pessoa com um problema': 'Anyone with a problem',

    // ─── HOMEPAGE — SERVICES PREVIEW ──────────────────────
    'Os nossos serviços': 'Our services',
    'Uma gama': 'A',
    'completa': 'complete',
    ', à medida do que precisas.': ' range, tailored to what you need.',
    'De um portátil que não liga ao site da tua empresa que precisa de upgrade. Trabalhamos com particulares e empresas, sempre com a mesma transparência.':
      'From a laptop that won\'t boot to your company website that needs an upgrade. We work with individuals and businesses, always with the same transparency.',
    'Assistência': 'Technical',
    'Técnica': 'Support',
    'Diagnóstico e reparação de computadores, consolas e equipamentos eletrónicos. Rapidez, precisão e total transparência — explicamos o que vamos fazer antes de o fazer.':
      'Diagnosis and repair of computers, consoles and electronic equipment. Fast, accurate and fully transparent — we explain what we\'ll do before we do it.',
    'Web &': 'Web &',
    'Digital': 'Digital',
    'Websites modernos, e-commerce e sistemas personalizados. Pensados para funcionarem em qualquer ecrã, rápidos a abrir e fáceis para o teu cliente usar.':
      'Modern websites, e-commerce and custom systems. Built to work on any screen, fast to load and easy for your customer to use.',
    'Software &': 'Software &',
    'Recuperação': 'Recovery',
    'Instalação e configuração de sistemas operativos, drivers e software essencial. Recuperação de dados perdidos — fotos, documentos, projetos.':
      'Installation and setup of operating systems, drivers and essential software. Recovery of lost data — photos, documents, projects.',
    'Não encontraste o que procuravas? A nossa paixão é criar': 'Didn\'t find what you were looking for? Our passion is building',
    'soluções à medida': 'tailored solutions',
    '. Conta-nos a tua ideia.': '. Tell us your idea.',
    'Fala connosco': 'Talk to us',

    // ─── HOMEPAGE — BIG MARK ──────────────────────────────
    'O Oásis': 'The Oasis',
    '·': '·',
    'de soluções': 'of solutions',

    // ─── HOMEPAGE — PORTFOLIO PREVIEW ─────────────────────
    'O nosso portfólio': 'Our portfolio',
    'Um vislumbre do nosso mundo de': 'A glimpse of our world of',
    'soluções': 'solutions',
    'Casos selecionados das nossas três áreas — desde computadores construídos peça a peça a websites entregues em menos de uma semana.':
      'Selected cases from our three areas — from computers built piece by piece to websites delivered in under a week.',
    'Hardware': 'Hardware',
    'Web · App': 'Web · App',
    'Diagnóstico': 'Diagnosis',
    'Construção de Computadores': 'Custom-built Computers',
    'Builds por medida — gaming, workstation, HTPC.': 'Custom builds — gaming, workstation, HTPC.',
    'Desenvolvimento Web/App': 'Web/App Development',
    'Sites modernos, e-commerce e sistemas custom.': 'Modern sites, e-commerce and custom systems.',
    'Diagnóstico de Hardware': 'Hardware Diagnosis',
    'Análise detalhada antes de qualquer reparação.': 'Detailed analysis before any repair.',

    // ─── HOMEPAGE — STATS ─────────────────────────────────
    'Áreas de serviço': 'Service areas',
    'técnica · web · software': 'support · web · software',
    'Internacional': 'International',
    'Área de actuação': 'Coverage area',
    'presencial · remoto': 'on-site · remote',
    'Fuseta': 'Fuseta',
    'Base': 'Base',
    'Para quem trabalhamos': 'Who we work for',
    'particulares e empresas': 'individuals and businesses',

    // ─── HOMEPAGE — ABOUT ─────────────────────────────────
    'Sobre nós': 'About us',
    'Tecnologia e': 'Technology and',
    'inovação digital': 'digital innovation',
    '— com pés assentes na areia.': '— with feet planted in the sand.',
    'A': 'The',
    'é uma empresa especializada em tecnologia e inovação digital, focada em oferecer soluções completas em manutenção de computadores, reparação de equipamentos eletrónicos e criação de websites modernos e eficientes.':
      'is a company specialised in technology and digital innovation, focused on delivering complete solutions in computer maintenance, electronics repair and the creation of modern, efficient websites.',
    'Combinamos': 'We combine',
    'conhecimento técnico, confiança e compromisso': 'technical expertise, trust and commitment',
    'para garantir resultados de qualidade, adaptados às necessidades de cada cliente. O nosso objetivo é simplificar a tecnologia e ajudar pessoas e negócios a tirarem o máximo proveito do mundo digital.':
      'to deliver quality results, adapted to each client\'s needs. Our goal is to simplify technology and help people and businesses make the most of the digital world.',
    'Confiança': 'Trust',
    'Eficiência': 'Efficiency',
    'Transparência': 'Transparency',
    'A nossa casa.': 'Our home.',

    // ─── HOMEPAGE — CTA ───────────────────────────────────
    'Soluções': 'Solutions',
    'para os seus problemas.': 'for your problems.',
    'Fala connosco e encontramos a solução certa. Estamos sempre disponíveis para ajudar — em pessoa em Fuseta ou em remoto para qualquer ponto do país.':
      'Talk to us and we\'ll find the right solution. We\'re always available to help — in person in Fuseta or remotely anywhere in the country.',
    'Entrar em contacto': 'Get in touch',

    // ─── SERVIÇOS — INDEX ─────────────────────────────────
    'Três áreas · uma só equipa': 'Three areas · one team',
    'Tudo o que': 'Everything',
    'precisas': 'you need',
    'num só sítio.': 'in one place.',
    'Assistência técnica, desenvolvimento web e recuperação de dados. Atendemos particulares e empresas, presencial ou remoto.':
      'Technical support, web development and data recovery. We serve individuals and businesses, on-site or remote.',
    'O que fazemos': 'What we do',
    'Três pilares, ligados pela mesma': 'Three pillars, joined by the same',
    'filosofia': 'philosophy',
    'Confiança, eficiência e transparência. Todos os trabalhos passam pelos mesmos três crivos — não importa se é um portátil empenado ou um e-commerce de raiz.':
      'Trust, efficiency and transparency. Every job goes through the same three filters — whether it\'s a warped laptop or an e-commerce build from scratch.',
    'Reparação e manutenção de computadores, consolas e equipamentos eletrónicos. Limpezas, upgrades, troca de écrãs, formatações.':
      'Repair and maintenance of computers, consoles and electronic equipment. Cleanings, upgrades, screen swaps, reinstalls.',
    'a partir de': 'starting at',
    'Websites, e-commerce, identidade visual. Construímos a tua presença digital de raiz, com tecnologia moderna e foco em conversão.':
      'Websites, e-commerce, brand identity. We build your digital presence from the ground up, with modern tech and a focus on conversion.',
    'desde': 'from',
    'Instalações de sistemas, drivers, antivírus. Recuperação de fotos, documentos e projetos perdidos por avaria ou apagamento.':
      'System installs, drivers, antivirus. Recovery of photos, documents and projects lost to hardware failure or deletion.',
    'Processo': 'Process',
    '3 passos': '3 steps',
    'Como trabalhamos': 'How we work',
    'Sem surpresas. Sem letras pequenas.': 'No surprises. No fine print.',
    'Tu descreves o problema; nós avaliamos e damos orçamento — sempre antes de mexer.':
      'You describe the problem; we assess and quote — always before we touch a thing.',
    'Execução': 'Execution',
    'Aprovas, fazemos. Mantemos-te informado em cada passo, em linguagem clara.':
      'You approve, we do it. We keep you informed at every step, in plain language.',
    'Entrega': 'Delivery',
    'Equipamento testado, dados intactos, fatura clara. Garantia incluída no preço.':
      'Equipment tested, data intact, clear invoice. Warranty included.',
    'Qual é o': 'What\'s',
    'teu': 'your',
    'problema?': 'problem?',
    'Conta-nos a tua situação no WhatsApp — em 24h tens orçamento e prazo. Sem compromisso.':
      'Tell us about your situation on WhatsApp — in 24h you have a quote and timeline. No commitment.',

    // ─── SERVIÇOS — ASSISTÊNCIA TÉCNICA ───────────────────
    'Reparação · upgrade · diagnóstico': 'Repair · upgrade · diagnosis',
    'técnica': 'support',
    'que faz sentido.': 'that makes sense.',
    'Reparamos computadores, portáteis, consolas e periféricos. Sempre com diagnóstico prévio e orçamento transparente — só avançamos com a tua autorização.':
      'We repair computers, laptops, consoles and peripherals. Always with prior diagnosis and a transparent quote — we only proceed with your approval.',
    'Visão geral': 'Overview',
    'Do': 'From',
    'diagnóstico': 'diagnosis',
    'à entrega — em tempo recorde.': 'to delivery — in record time.',
    'Quando um equipamento falha, perdes tempo, dinheiro e paciência. A nossa missão é simples: devolver-te o equipamento a funcionar como novo, no mais curto espaço de tempo possível, com a fatura clara e a garantia incluída.':
      'When equipment fails, you lose time, money and patience. Our mission is simple: return your equipment working like new, in the shortest possible time, with a clear invoice and warranty included.',
    'Serviços incluídos': 'Services included',
    'Hardware e': 'Hardware and',
    'manutenção': 'maintenance',
    'física.': 'physical.',
    'Tabela de referência — o valor final depende do equipamento, do número de componentes e da complexidade. Damos sempre orçamento antes de avançar.':
      'Reference pricing — the final price depends on the equipment, number of components and complexity. We always quote before proceeding.',
    'Diagnóstico de avaria': 'Fault diagnosis',
    'Identificação do problema no equipamento. Inclui relatório técnico e orçamento de reparação.':
      'Identifying the problem with the equipment. Includes technical report and repair quote.',
    '· abatido se reparares': '· waived if you proceed',
    'Limpeza básica': 'Basic cleaning',
    'Limpeza de ventoinhas e dissipadores sem desmontar componentes — só pelas janelas do gabinete.':
      'Cleaning fans and heatsinks without dismantling components — just through the case openings.',
    'Desktop': 'Desktop',
    'Portátil': 'Laptop',
    'Limpeza profunda': 'Deep cleaning',
    'Desmontagem total — gráfica, fonte, dissipadores. Inclui massa térmica de alta qualidade. Varia com tamanho do PC.':
      'Full disassembly — GPU, PSU, heatsinks. Includes high-quality thermal paste. Varies with PC size.',
    'Limpeza química': 'Chemical cleaning',
    'Banho de ultrassons, descontaminação da board, troca de pastas térmicas (CPU, chipset, gráfica) e almofadas térmicas. Remove manchas e sujidades difíceis.':
      'Ultrasonic bath, board decontamination, thermal paste replacement (CPU, chipset, GPU) and thermal pads. Removes stains and stubborn dirt.',
    'Instalação de componentes': 'Component installation',
    'RAM, SSD, placa gráfica e outros. Inclui configuração e teste do componente.':
      'RAM, SSD, GPU and more. Includes configuration and component testing.',
    '/comp.': '/comp.',
    'sob orçamento': 'on quote',
    'Montagem de PC': 'PC build',
    'Montagem física, gestão de cabos, atualização de BIOS, instalação de SO, drivers e stress test. Inclui perfis XMP/EXPO e curvas de ventoinhas em builds mais complexas.':
      'Physical assembly, cable management, BIOS update, OS install, drivers and stress test. Includes XMP/EXPO profiles and fan curves on more complex builds.',
    'Office': 'Office',
    'Gaming': 'Gaming',
    'High-End': 'High-End',
    'Extras:': 'Extras:',
    'Taxa de urgência (<48h)': 'Rush fee (<48h)',
    '· Deslocação ao domicílio': '· On-site call-out',
    '· Orçamentos sempre transparentes antes de qualquer trabalho.': '· Transparent quotes before any work, always.',
    'Pedir orçamento': 'Request a quote',
    'abatido se reparares': 'waived if you proceed',
    'Urgência': 'Rush',
    'taxa de 25€': '€25 fee',
    'Deslocação': 'Call-out',
    'ao domicílio': 'on-site',
    'Garantia': 'Warranty',
    'em todas as reparações': 'on all repairs',
    'Perguntas frequentes': 'Frequently asked',
    'As dúvidas mais': 'The most',
    'comuns': 'common',
    'Cobram pelo orçamento?': 'Is the quote free?',
    'O orçamento é gratuito. O diagnóstico técnico (25€) é abatido no valor do orçamento se decidires avançar com a reparação — só fica como custo final se desistires.':
      'The quote is free. The technical diagnosis (€25) is deducted from the quote if you proceed with the repair — it only becomes a final cost if you back out.',
    'Têm garantia?': 'Is there a warranty?',
    'Sim, 30 dias em todas as reparações de mão-de-obra. Peças seguem a garantia do fabricante.':
      'Yes, 30 days on all repair labour. Parts follow the manufacturer\'s warranty.',
    'Atendem ao domicílio?': 'Do you offer on-site service?',
    'Sim. A deslocação ao domicílio é cobrada a 0,80€/km a partir da Fuseta.':
      'Yes. On-site call-outs are charged at €0.80/km from Fuseta.',
    'Pronto para': 'Ready to',
    'resolver': 'fix this',
    'Descreve-nos o problema no WhatsApp e tens orçamento em 24h.': 'Describe the problem on WhatsApp and you\'ll have a quote in 24h.',
    'Ver outros serviços': 'See other services',

    // ─── SERVIÇOS — WEB & DIGITAL ─────────────────────────
    'Websites · e-commerce · sistemas': 'Websites · e-commerce · systems',
    'Presença digital': 'Digital presence',
    'que converte': 'that converts',
    'em clientes.': 'into customers.',
    'Construímos websites, lojas online e sistemas personalizados. Tecnologia moderna (Next.js, React) com foco em velocidade, SEO e conversão.':
      'We build websites, online stores and custom systems. Modern tech (Next.js, React) with a focus on speed, SEO and conversion.',
    'Mais do que um': 'More than just a',
    'site': 'site',
    '— uma ferramenta de negócio.': '— a business tool.',
    'Um site bonito que não vende não serve. Desenhamos cada projeto a partir do objetivo do teu negócio: captar clientes, vender produtos, agendar marcações. Tudo o que fazemos é otimizado para mobile, rápido a carregar, e pronto para SEO local.':
      'A pretty site that doesn\'t sell is useless. We design every project around your business goal: acquire customers, sell products, take bookings. Everything we build is mobile-optimised, fast to load, and ready for local SEO.',
    'Web, e-commerce e': 'Web, e-commerce and',
    'sistemas': 'systems',
    'Preço médio por tipo de projeto. O valor final depende do escopo, número de páginas, integrações e conteúdo. Orçamento detalhado após reunião.':
      'Average pricing per project type. The final price depends on scope, number of pages, integrations and content. Detailed quote after a meeting.',
    'Landing Page (1 página)': 'Landing Page (1 page)',
    'Página única para campanha, captação de leads, lançamento de produto ou evento. Sobe com integrações (CRM/email) e multilíngua.':
      'Single page for a campaign, lead capture, product launch or event. Increases with integrations (CRM/email) and multilingual.',
    'Site institucional': 'Institutional site',
    'Home, Sobre, Serviços, Contactos e o que mais fizer sentido. Sobe com mais páginas, multilíngua, SEO completo e conteúdos.':
      'Home, About, Services, Contact and whatever else makes sense. Increases with more pages, multilingual, full SEO and content.',
    'Loja Online (E-commerce)': 'Online Store (E-commerce)',
    'Catálogo, carrinho, pagamentos, envios, faturação. Sobe com muitos produtos, variações, integrações ERP/stock e envios complexos.':
      'Catalogue, cart, payments, shipping, invoicing. Increases with many products, variants, ERP/stock integrations and complex shipping.',
    'Site ou app à medida': 'Custom site or app',
    'Portal, área de membros, funcionalidades feitas “de raiz”. Normalmente orçado por escopo, integrações e funcionalidades específicas.':
      'Portal, member area, features built from scratch. Usually quoted by scope, integrations and specific features.',
    'Manutenção & suporte': 'Maintenance & support',
    'Backups, atualizações, monitorização e pequenas alterações de conteúdo. Mensal ou anual, definido com o cliente.':
      'Backups, updates, monitoring and small content changes. Monthly or yearly, defined with the client.',
    'Sob orçamento': 'On quote',
    '· recorrente': '· recurring',
    'Domínios, alojamento & extras': 'Domains, hosting & extras',
    'Tudo o que sejam despesas mensais ou anuais — domínio, alojamento, SSL, emails. Definido à parte com o cliente.':
      'Anything billed monthly or yearly — domain, hosting, SSL, emails. Agreed separately with the client.',
    'À parte': 'Separate',
    '· valor combinado': '· agreed amount',
    'O que faz subir o preço:': 'What raises the price:',
    'taxa de urgência, integrações (CRM, email, ERP/stock), textos mais elaborados, design premium, multilíngua, mais páginas e SEO mais completo. Urgências aceites sob disponibilidade, com taxa extra.':
      'rush fee, integrations (CRM, email, ERP/stock), more elaborate copy, premium design, multilingual, more pages and fuller SEO. Rush jobs accepted subject to availability, with extra fee.',
    'Falar sobre o projeto': 'Talk about the project',
    'Landing': 'Landing',
    '1 página': '1 page',
    'Institucional': 'Institutional',
    'até ~6 páginas': 'up to ~6 pages',
    'E-commerce': 'E-commerce',
    'loja online': 'online store',
    'À medida': 'Custom',
    'portal / app': 'portal / app',
    'Quanto custa um site para a minha empresa?': 'How much does a website cost for my business?',
    'Sites institucionais ficam tipicamente entre 500€ e 2.000€ (depende do número de páginas, multilíngua, SEO e conteúdos). Landing pages entre 200€ e 750€. Lojas online a partir de 1.000€. Pedimos sempre uma reunião curta para entender o teu negócio antes de orçamentar.':
      'Institutional sites typically range from €500 to €2,000 (depending on number of pages, multilingual, SEO and content). Landing pages from €200 to €750. Online stores from €1,000. We always schedule a short meeting to understand your business before quoting.',
    'Em quanto tempo está pronto?': 'How long until it\'s ready?',
    'Um site institucional fica pronto em 2-3 semanas. E-commerce em 4-6 semanas. Damos-te sempre uma data concreta no orçamento.':
      'An institutional site is ready in 2-3 weeks. E-commerce in 4-6 weeks. We always give you a concrete date in the quote.',
    'Posso editar o site sozinho depois?': 'Can I edit the site myself afterwards?',
    'Sim. Entregamos com um painel de gestão simples onde podes editar textos, imagens e produtos. Damos formação incluída.':
      'Yes. We deliver with a simple admin panel where you can edit text, images and products. Training is included.',
    'O site vai aparecer no Google?': 'Will the site show up on Google?',
    'Entregamos com SEO base configurado (meta tags, schema, sitemap, performance otimizada). Para procuras competitivas, recomendamos o nosso pacote SEO continuado.':
      'We deliver with baseline SEO configured (meta tags, schema, sitemap, optimised performance). For competitive searches, we recommend our ongoing SEO package.',
    'Tratam do alojamento e domínio?': 'Do you handle hosting and domain?',
    'Sim, tratamos de tudo — domínio, alojamento, SSL, emails. Estas despesas são mensais ou anuais e ficam definidas à parte com o cliente, com transparência total. Podes também manter os teus existentes se preferires.':
      'Yes, we handle everything — domain, hosting, SSL, emails. These are monthly or yearly expenses, agreed separately with the client, fully transparent. You can also keep your existing ones if you prefer.',

    // ─── SERVIÇOS — SOFTWARE & RECUPERAÇÃO ────────────────
    'Sistemas · dados · segurança': 'Systems · data · security',
    'Recuperamos': 'We recover',
    'o que parecia': 'what seemed',
    'perdido.': 'lost.',
    'Recuperação de fotos, documentos e projetos perdidos por avaria, formatação acidental ou ransomware. Também instalamos e configuramos sistemas operativos e software essencial.':
      'Recovery of photos, documents and projects lost to hardware failure, accidental formatting or ransomware. We also install and configure operating systems and essential software.',
    'Antes de comprar um equipamento': 'Before buying',
    'novo': 'new',
    '— fala connosco.': 'equipment — talk to us.',
    '90% dos discos rígidos com falhas ainda têm dados recuperáveis. Não desistas das fotos do casamento ou da contabilidade da empresa. Temos ferramentas profissionais e experiência para abordar casos difíceis — incluindo discos com avaria física e ataques de ransomware.':
      '90% of failing hard drives still hold recoverable data. Don\'t give up on the wedding photos or the company books. We have professional tools and experience to tackle difficult cases — including physically damaged drives and ransomware attacks.',
    'Software, sistemas e': 'Software, systems and',
    'dados': 'data',
    'Tabela de referência — o valor final depende do tipo de avaria, da rapidez exigida e do estado do equipamento. Diagnóstico inicial sem compromisso.':
      'Reference pricing — the final price depends on the type of failure, urgency required and condition of the equipment. Initial diagnosis with no commitment.',
    'Formatação + SO (sem backup)': 'Format + OS (no backup)',
    'Instalação do SO, drivers atualizados e software básico. Inclui apps nativas ou as que o cliente pedir — sem as configurar.':
      'OS install, updated drivers and basic software. Includes native apps or those the client requests — without configuring them.',
    'Formatação com backup': 'Format with backup',
    'Formatação com transferência segura de todos os dados. Valor sobe pelo tempo de transferência e segurança dos ficheiros.':
      'Format with secure transfer of all data. Price increases with transfer time and file safety.',
    'Remoção de vírus & otimização': 'Virus removal & optimisation',
    'Limpeza de vírus, configuração de antivírus e programas de prevenção. Preço varia consoante seja malware/adware standard ou vírus críticos / spyware.':
      'Virus cleaning, antivirus and prevention software setup. Price varies depending on whether it\'s standard malware/adware or critical viruses / spyware.',
    '· mais para vírus críticos': '· more for critical viruses',
    'Recuperação de dados': 'Data recovery',
    'Dados perdidos por formatação, disco corrompido ou inacessível. Inclui discos rígidos, SSD, pens USB e cartões de memória. Preço depende do tamanho, rapidez e estado do disco.':
      'Data lost to formatting, corrupted or inaccessible disk. Includes hard drives, SSD, USB sticks and memory cards. Price depends on size, urgency and disk condition.',
    'Sob consulta': 'On request',
    '· diagnóstico em 48h': '· diagnosis in 48h',
    'Migração de dados': 'Data migration',
    'Passagem segura de ficheiros, emails, favoritos e definições para um novo equipamento. Mantém tudo onde estava.':
      'Safe transfer of files, emails, bookmarks and settings to new equipment. Everything stays where it was.',
    '· depende do volume': '· depends on volume',
    'Backup automático & cloud sync': 'Automatic backup & cloud sync',
    'Configuração de rotinas de backup preventivas (local + cloud). Vale infinitamente mais que uma recuperação.':
      'Setup of preventive backup routines (local + cloud). Worth infinitely more than a recovery.',
    '· serviço preventivo': '· preventive service',
    'Importante:': 'Important:',
    'Em recuperação de dados, sem dados recuperados, sem custo. As avarias físicas (sala limpa, troca de cabeças) são reencaminhadas para laboratórios parceiros certificados. Urgências aceites sob disponibilidade, com taxa extra.':
      'In data recovery, no data recovered means no charge. Physical failures (clean room, head swap) are routed to certified partner labs. Rush jobs accepted subject to availability, with extra fee.',
    'Formatação': 'Format',
    'a partir de, sem backup': 'starting from, no backup',
    'de discos com avaria': 'of failing drives',
    'Sem dados': 'No data',
    'sem dados, sem custo': 'no data, no charge',
    'E se não conseguirem recuperar os dados?': 'What if you can\'t recover the data?',
    'Política simples: sem dados, sem custo. O diagnóstico inicial é gratuito e só cobramos se a recuperação for bem-sucedida.':
      'Simple policy: no data, no charge. The initial diagnosis is free and we only charge if recovery is successful.',
    'Quanto custa a recuperação?': 'How much does recovery cost?',
    'Recuperações lógicas (formatação, disco corrompido) variam consoante o tamanho dos dados, a rapidez exigida e o tempo que o disco tenha de avaria. Avarias físicas são orçadas à parte. O orçamento exato é dado após diagnóstico em 48h.':
      'Logical recoveries (formatting, corrupted disk) vary with data size, urgency required and how long the disk has been failing. Physical failures are quoted separately. The exact quote is given after diagnosis within 48h.',
    'Os meus dados ficam confidenciais?': 'Is my data kept confidential?',
    'Absolutamente. Assinamos NDA quando solicitado e nunca vemos o conteúdo dos teus ficheiros — apenas as estruturas necessárias para a recuperação.':
      'Absolutely. We sign an NDA on request and never look at the content of your files — only the structures needed for recovery.',
    'Recuperam de discos com avaria física?': 'Can you recover physically damaged disks?',
    'Recuperações que exijam sala limpa ou troca de cabeças são reencaminhadas para laboratórios parceiros certificados, com quem trabalhamos há anos. Mantemos a comunicação contigo durante todo o processo.':
      'Recoveries requiring clean room or head swap are routed to certified partner labs we\'ve worked with for years. We stay in touch with you throughout the process.',
    'Posso prevenir isto?': 'Can I prevent this?',
    'Sim! Configuramos backup automático (cloud + local) sob orçamento. O valor depende do volume de dados e do número de dispositivos. Vale infinitamente mais do que uma recuperação futura.':
      'Yes! We set up automatic backup (cloud + local) on quote. The price depends on data volume and number of devices. Worth infinitely more than a future recovery.',

    // ─── PORTFÓLIO ────────────────────────────────────────
    '12 projetos · 3 áreas': '12 projects · 3 areas',
    'Trabalhos': 'Work',
    'feitos': 'done',
    'com cuidado.': 'with care.',
    'Uma seleção dos projetos que melhor representam o nosso trabalho. Hardware, software e web — tudo no mesmo sítio.':
      'A selection of projects that best represent our work. Hardware, software and web — all in one place.',
    'Casos selecionados': 'Selected cases',
    'Um vislumbre do nosso': 'A glimpse of our',
    'portefólio': 'portfolio',
    'De um portátil quase irrecuperável a um e-commerce a faturar no primeiro mês. Pequenas vitórias e projetos a sério.':
      'From a nearly unrecoverable laptop to an e-commerce billing in its first month. Small wins and serious projects.',
    'Hardware · Build': 'Hardware · Build',
    'PC Gaming Ryzen 7': 'Ryzen 7 Gaming PC',
    'Build completa por medida — RTX 4070, 32GB DDR5, watercooling. Entregue testado e overclock estável.':
      'Full custom build — RTX 4070, 32GB DDR5, watercooling. Delivered tested and stable overclock.',
    'Web · E-commerce': 'Web · E-commerce',
    'Loja Tasca do Mar': 'Tasca do Mar Store',
    'E-commerce de peixe fresco com entrega no Algarve. 3 semanas, gestão de stock em tempo real.':
      'Fresh fish e-commerce with delivery in the Algarve. 3 weeks, real-time stock management.',
    'Reparação': 'Repair',
    'MacBook Pro 2019': 'MacBook Pro 2019',
    'Substituição de teclado e bateria. Recuperação de dados de SSD com erros de leitura.':
      'Keyboard and battery replacement. Data recovery from an SSD with read errors.',
    'Workstation': 'Workstation',
    'Setup Estúdio Foto': 'Photo Studio Setup',
    'Workstation Threadripper + dois monitores 4K calibrados. Pronto para edição RAW de alto volume.':
      'Threadripper workstation + two calibrated 4K monitors. Ready for high-volume RAW editing.',
    'Web · Institucional': 'Web · Institutional',
    'Site Café Algarvio': 'Algarve Café Site',
    'Site institucional + reservas. SEO local — primeira página Google em 2 meses.':
      'Institutional site + bookings. Local SEO — Google first page in 2 months.',
    'Disco WD 2TB': 'WD 2TB Drive',
    'Recuperação de fotografias de casamento de um disco com setores danificados. 98% recuperado.':
      'Wedding photo recovery from a disk with bad sectors. 98% recovered.',
    'Software': 'Software',
    'Sistema POS': 'POS System',
    'POS personalizado para restauração, integrado com impressora térmica e gaveta de dinheiro.':
      'Custom POS for restaurants, integrated with thermal printer and cash drawer.',
    'Vê mais no nosso': 'See more on our',
    'Instagram': 'Instagram',
    '— projetos novos quase todas as semanas.': '— new projects almost every week.',
    'O': 'The',
    'próximo': 'next',
    'pode ser o teu.': 'one could be yours.',
    'Conta-nos a tua ideia e damos-te uma proposta concreta em 24h.':
      'Tell us your idea and we\'ll give you a concrete proposal in 24h.',

    // ─── CONTACTO ─────────────────────────────────────────
    'Resposta em < 24h · Fuseta, Algarve': 'Reply in < 24h · Fuseta, Algarve',
    'Fala': 'Get in',
    'connosco': 'touch',
    'Descreve o teu problema como conseguires — nós traduzimos. WhatsApp é o caminho mais rápido, mas estamos em todo o lado.':
      'Describe your problem however you can — we\'ll translate. WhatsApp is the fastest route, but we\'re everywhere.',
    'WhatsApp': 'WhatsApp',
    'rápido': 'fast',
    'O canal preferido — respondemos em minutos durante o dia. +351 961 531 235':
      'Our preferred channel — we reply in minutes during the day. +351 961 531 235',
    'resposta em': 'reply in',
    'minutos': 'minutes',
    'Email': 'Email',
    'direto': 'direct',
    'Para questões mais detalhadas ou envio de ficheiros. Resposta em menos de 24 horas.':
      'For more detailed questions or file sharing. Reply within 24 hours.',
    'Vê o nosso trabalho recente, projetos em curso e a vida na oficina.':
      'See our recent work, ongoing projects and life in the workshop.',
    'Formulário de contacto': 'Contact form',
    'Envia-nos uma': 'Send us a',
    'mensagem': 'message',
    'Preenche o formulário e respondemos em menos de 24 horas. Se vens de um produto da loja, o assunto já está preenchido.':
      'Fill in the form and we\'ll reply within 24 hours. If you came from a shop product, the subject is already filled in.',
    'Nome': 'Name',
    'Telemóvel': 'Mobile',
    '(opcional)': '(optional)',
    'Tipo de pedido': 'Request type',
    'Serviço — assistência, web ou software': 'Service — support, web or software',
    'Produto da loja': 'Shop product',
    'Outro / dúvida geral': 'Other / general question',
    'Assunto': 'Subject',
    'Mensagem': 'Message',
    'Enviar mensagem': 'Send message',
    'Ao enviar, abre-se o teu cliente de email com tudo pronto.': 'On submit, your email client opens with everything ready.',
    'Onde estamos': 'Where we are',
    'Fuseta · Algarve': 'Fuseta · Algarve',
    'Detalhes': 'Details',
    'para chegar até nós.': 'need to reach us.',
    'Morada:': 'Address:',
    'Fuseta, Algarve, Portugal': 'Fuseta, Algarve, Portugal',
    'Telemóvel/WhatsApp:': 'Mobile/WhatsApp:',
    'Email:': 'Email:',
    'Horário:': 'Hours:',
    'Segunda a sexta · 09h-19h': 'Monday to Friday · 9am-7pm',
    'Sábado · sob marcação': 'Saturday · by appointment',
    'Atendemos em pessoa na Fuseta e em remoto para qualquer ponto do país. Para problemas urgentes (servidor parado, dados perdidos, e-commerce em baixo) tenta-nos pelo WhatsApp — é o caminho mais rápido.':
      'We serve in person in Fuseta and remotely anywhere in the country. For urgent issues (server down, lost data, e-commerce offline) try us on WhatsApp — it\'s the fastest route.',

    // ─── LOJA ─────────────────────────────────────────────
    'Equipamentos': 'Equipment',
    'e peças': 'and parts',
    'com selo nosso.': 'with our stamp.',
    'Filtra, pesquisa e encontra o que precisas. Cada produto tem o estado claro — novo, recondicionado ou usado — e pode ser pedido por WhatsApp ou formulário.':
      'Filter, search and find what you need. Every product has its state clearly marked — new, refurbished or used — and can be requested via WhatsApp or form.',
    'Recém-adicionados': 'Recently added',
    'Preço · crescente': 'Price · ascending',
    'Preço · decrescente': 'Price · descending',
    'Limpar': 'Clear',
    'Novo': 'New',
    'Recondicionado': 'Refurbished',
    'Usado': 'Used',
    'Sem produtos disponíveis': 'No products available',
    'A loja está em preparação — novos produtos estarão disponíveis em breve. Fala connosco se procuras algo específico.':
      'The shop is being prepared — new products will be available soon. Talk to us if you\'re looking for something specific.',
    'Pedir produto': 'Request a product',
    'Falar connosco': 'Talk to us',
    'Garantias da loja': 'Shop warranties',
    'Compras com': 'Shop with',
    'tranquilidade': 'peace of mind',
    'anos': 'years',
    'produtos novos · DL 84/2021': 'new products · DL 84/2021',
    'meses': 'months',
    'produtos recondicionados': 'refurbished products',
    'dias': 'days',
    'Devolução': 'Returns',
    'compras à distância': 'distance purchases',
    'Lê os detalhes nas nossas': 'Read the details in our',
    'políticas oficiais': 'official policies',
    'Política de garantia': 'Warranty policy',

    // ─── POLÍTICAS ────────────────────────────────────────
    'Legal · RGPD': 'Legal · GDPR',
    'Política de': 'Our',
    'privacidade.': 'privacy policy.',
    'Como tratamos os teus dados — em linguagem clara, conforme o RGPD.':
      'How we handle your data — in plain language, GDPR-compliant.',
    'Responsável pelo tratamento': 'Data controller',
    'Os dados pessoais que nos forneces são tratados pela': 'Personal data you provide is processed by',
    ', com sede em Fuseta, Algarve. Para qualquer questão relativa a privacidade, contacta-nos em':
      ', based in Fuseta, Algarve. For any privacy question, contact us at',
    'Dados que recolhemos': 'Data we collect',
    'Recolhemos apenas os dados necessários para te prestar o serviço:': 'We only collect data needed to provide the service:',
    'nome, contacto telefónico, email, NIF': 'name, phone, email, tax number',
    '(para faturação), e detalhes técnicos do equipamento entregue para reparação. Em projetos web, podemos recolher dados adicionais necessários ao projeto (logos, credenciais, conteúdo). Estes são tratados com o sigilo necessário.':
      '(for invoicing), and technical details of the equipment handed in for repair. On web projects, we may collect additional data needed (logos, credentials, content). These are treated with the necessary confidentiality.',
    'Como usamos os dados': 'How we use the data',
    'Os dados são usados exclusivamente para: (a) prestação do serviço solicitado; (b) faturação e cumprimento de obrigações fiscais; (c) comunicação relativa ao trabalho em curso; (d) exercício do direito de garantia. Nunca cedemos os teus dados a terceiros para marketing.':
      'Data is used exclusively for: (a) providing the requested service; (b) invoicing and tax compliance; (c) communication about ongoing work; (d) exercising warranty rights. We never share your data with third parties for marketing.',
    'Cookies e site': 'Cookies and site',
    'Este site usa apenas cookies essenciais ao funcionamento e cookies estatísticos anónimos (medição de tráfego). Não há cookies de marketing nem trackers de terceiros. O site não usa Google Analytics ou pixels de redes sociais.':
      'This site uses only essential functional cookies and anonymous statistical cookies (traffic measurement). There are no marketing cookies or third-party trackers. The site does not use Google Analytics or social media pixels.',
    'Prazo de conservação': 'Retention period',
    'Os dados de faturação são conservados pelo prazo legalmente exigido (10 anos). Outros dados pessoais são tratados com confidencialidade e mantidos enquanto forem necessários para a prestação do serviço e para cumprir obrigações legais.':
      'Invoicing data is kept for the legally required period (10 years). Other personal data is treated confidentially and kept as long as needed to provide the service and comply with legal obligations.',
    'Os teus direitos': 'Your rights',
    'Tens direito a: (a) aceder aos teus dados; (b) corrigi-los; (c) pedir o seu apagamento (direito ao esquecimento); (d) opor-te ao tratamento; (e) portabilidade dos dados; (f) apresentar queixa à CNPD. Para exercer qualquer destes direitos, escreve para':
      'You have the right to: (a) access your data; (b) correct it; (c) request its erasure (right to be forgotten); (d) object to processing; (e) data portability; (f) lodge a complaint with the CNPD. To exercise any of these rights, write to',
    'Segurança': 'Security',
    'Aplicamos medidas técnicas e organizativas para proteger os teus dados: dispositivos de armazenamento encriptados, backups isolados, acesso restrito por palavra-passe, NDA com qualquer parceiro externo.':
      'We apply technical and organisational measures to protect your data: encrypted storage devices, isolated backups, password-restricted access, NDA with any external partner.',
    '.': '.',

    'Loja · políticas': 'Shop · policies',
    'garantia.': 'warranty policy.',
    'Os direitos do consumidor estão em primeiro lugar. Conforme o Decreto-Lei n.º 84/2021.':
      'Consumer rights come first. Pursuant to Decree-Law No. 84/2021.',
    'Prazo de garantia': 'Warranty period',
    'Todos os produtos novos vendidos pela RedDune Solutions têm uma':
      'All new products sold by RedDune Solutions have a',
    'garantia de 3 anos': '3-year warranty',
    'a partir da data de entrega, conforme o Decreto-Lei n.º 84/2021. Produtos recondicionados têm uma garantia de':
      'from the date of delivery, pursuant to Decree-Law No. 84/2021. Refurbished products have a warranty of',
    '6 meses': '6 months',
    ', claramente indicada no momento da compra.': ', clearly stated at the point of sale.',
    'O que está coberto': 'What is covered',
    'Defeitos de fabrico, avarias internas não causadas por uso indevido, e desconformidades entre o produto entregue e o produto descrito. A garantia inclui reparação gratuita, substituição, redução do preço ou rescisão do contrato, conforme aplicável.':
      'Manufacturing defects, internal failures not caused by misuse, and discrepancies between the product delivered and described. The warranty includes free repair, replacement, price reduction or contract termination, as applicable.',
    'O que não está coberto': 'What is not covered',
    'Danos por queda, líquidos, sobrecargas elétricas, modificações não autorizadas, software de terceiros, baterias após o primeiro ano (consumível). Em portáteis e telemóveis recondicionados, riscos estéticos cosméticos estão excluídos.':
      'Damage from drops, liquids, electrical surges, unauthorised modifications, third-party software, batteries after the first year (consumable). On refurbished laptops and phones, cosmetic scratches are excluded.',
    'Como acionar a garantia': 'How to claim the warranty',
    'Contacta-nos por WhatsApp (': 'Contact us by WhatsApp (',
    ') ou email (': ') or email (',
    ') com a fatura e descrição do problema. Damos-te uma resposta concreta logo que tenhamos avaliado o produto.':
      ') with the invoice and a description of the problem. We\'ll give you a concrete answer as soon as we\'ve assessed the product.',
    'Serviços de mão-de-obra': 'Labour services',
    'Reparações realizadas pelos nossos serviços técnicos têm garantia de':
      'Repairs performed by our technical service have a',
    '30 dias': '30 days',
    'sobre a mão-de-obra e sobre quaisquer peças substituídas (estas seguem também a garantia do fabricante).':
      'warranty on labour and on any replaced parts (these also follow the manufacturer\'s warranty).',
    'Direito legal preservado': 'Legal rights preserved',
    'Esta política não afeta os teus direitos legais enquanto consumidor. Em caso de conflito entre esta política e a legislação portuguesa, prevalece a lei.':
      'This policy does not affect your legal rights as a consumer. In case of conflict between this policy and Portuguese law, the law prevails.',

    'devolução.': 'returns policy.',
    'Direito de livre resolução em compras à distância — 14 dias, sem perguntas.':
      'Right of withdrawal for distance purchases — 14 days, no questions asked.',
    'Direito de livre resolução': 'Right of withdrawal',
    'Para compras realizadas à distância (online, WhatsApp, email), tens': 'For purchases made remotely (online, WhatsApp, email), you have',
    '14 dias': '14 days',
    'a contar da data de receção para devolver o produto sem indicar motivo, conforme o Decreto-Lei n.º 24/2014.':
      'from the date of receipt to return the product without giving a reason, pursuant to Decree-Law No. 24/2014.',
    'Como devolver': 'How to return',
    'Notifica-nos da intenção de devolução por email (': 'Notify us of your intent to return by email (',
    ') ou WhatsApp. Embala o produto na embalagem original, com todos os acessórios. Tens 14 dias adicionais para o entregar ou enviar de volta.':
      ') or WhatsApp. Pack the product in its original packaging with all accessories. You have an additional 14 days to deliver or ship it back.',
    'Estado do produto': 'Product condition',
    'O produto deve estar em condição idêntica à da entrega: sem sinais de uso, com todos os acessórios, manuais e embalagem original. Software instalado, ativações de licença e personalizações irreversíveis podem afetar o valor do reembolso.':
      'The product must be in the same condition as delivered: no signs of use, with all accessories, manuals and original packaging. Installed software, license activations and irreversible customisations may affect the refund amount.',
    'Custos de devolução': 'Return costs',
    'Os custos de envio de devolução são da responsabilidade do cliente, salvo se o produto estiver defeituoso ou em desconformidade — caso em que assumimos o custo de recolha.':
      'Return shipping costs are the customer\'s responsibility, unless the product is defective or non-conforming — in which case we cover the pickup cost.',
    'Reembolso': 'Refund',
    'Reembolsamos a totalidade do valor pago (incluindo portes originais) através do mesmo método de pagamento, em até':
      'We refund the full amount paid (including original shipping) via the same payment method, within',
    'após receção do produto e validação do seu estado.':
      'after receiving the product and verifying its condition.',
    'Exceções': 'Exceptions',
    'Não são aceites devoluções de: produtos personalizados (builds por medida segundo especificação do cliente), software com licença ativada, produtos consumíveis abertos (cabos cortados à medida), e ofertas promocionais identificadas como não-reembolsáveis.':
      'Returns are not accepted for: custom products (builds tailored to customer specification), software with activated license, opened consumable products (custom-cut cables), and promotional offers marked as non-refundable.',
    'Compras em loja': 'In-store purchases',
    'Para compras presenciais (não à distância), aplicam-se as garantias legais previstas no DL 84/2021, mas não existe o direito de livre resolução automático — qualquer troca fica ao critério da RedDune Solutions.':
      'For in-store (non-distance) purchases, legal warranties under DL 84/2021 apply, but there is no automatic right of withdrawal — any exchange is at RedDune Solutions\' discretion.',

    // ─── FOOTER ───────────────────────────────────────────
    'Assistência técnica informática, desenvolvimento web e recuperação de dados em Fuseta, Algarve.':
      'Computer repair, web development and data recovery in Fuseta, Algarve.',
    'Assistência técnica informática, desenvolvimento web e recuperação de dados em Fuseta, Algarve. Serviço personalizado para particulares e empresas.':
      'Computer repair, web development and data recovery in Fuseta, Algarve. Tailored service for individuals and businesses.',
    'Navegação': 'Navigation',
    'Empresa': 'Company',
    'Contacto': 'Contact',
    'Política de Garantia': 'Warranty Policy',
    'Política de Devolução': 'Returns Policy',
    'Política de Privacidade': 'Privacy Policy',
  };

  // Attribute translations (placeholder, title, aria-label, alt where it
  // makes sense). Same dictionary lookup.
  const ATTR_DICT = {
    'O teu nome': 'Your name',
    'email@exemplo.pt': 'email@example.com',
    '+351 9XX XXX XXX': '+351 9XX XXX XXX',
    'Em uma frase, o que precisas': 'In one sentence, what you need',
    'Descreve o que precisas, equipamento, prazos, etc.':
      'Describe what you need, equipment, deadlines, etc.',
    'Pesquisar nome ou especificação…': 'Search name or specification…',
    'Categoria': 'Category',
    'Marca': 'Brand',
    'Ordenação': 'Sort',
    'Filtro por estado': 'Filter by state',
    'Localização — Fuseta, Algarve': 'Location — Fuseta, Algarve',
  };

  // Document title + meta description translations (matched against trimmed
  // string of the existing PT title / meta).
  const PAGE_META = {
    'Início — RedDune Solutions': 'Home — RedDune Solutions',
    'Serviços — RedDune Solutions': 'Services — RedDune Solutions',
    'Portfólio — RedDune Solutions': 'Portfolio — RedDune Solutions',
    'Loja — RedDune Solutions': 'Shop — RedDune Solutions',
    'Contacto — RedDune Solutions': 'Contact — RedDune Solutions',
    'Assistência Técnica — RedDune Solutions': 'Technical Support — RedDune Solutions',
    'Web & Digital — RedDune Solutions': 'Web & Digital — RedDune Solutions',
    'Software & Recuperação — RedDune Solutions': 'Software & Recovery — RedDune Solutions',
    'Política de Privacidade — RedDune Solutions': 'Privacy Policy — RedDune Solutions',
    'Política de Garantia — RedDune Solutions': 'Warranty Policy — RedDune Solutions',
    'Política de Devolução — RedDune Solutions': 'Returns Policy — RedDune Solutions',
  };

  // ─── HELPERS ────────────────────────────────────────────
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'SVG', 'TEMPLATE']);

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    applyLang();
    document.documentElement.lang = lang;
    updateSwitcher();
  }

  // Walk text nodes inside `root`, swap PT ↔ EN.
  // Stores the original PT in node.__rds_pt so we can revert.
  function translateTextNodes(root, lang) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = node.parentNode;
        if (p && SKIP_TAGS.has(p.nodeName)) return NodeFilter.FILTER_REJECT;
        // Inside SVG?
        let el = p;
        while (el) {
          if (el.namespaceURI === 'http://www.w3.org/2000/svg') return NodeFilter.FILTER_REJECT;
          el = el.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);

    for (const node of nodes) {
      const original = node.__rds_pt || node.nodeValue;
      const trimmed = original.trim();
      if (!node.__rds_pt) node.__rds_pt = original;

      if (lang === 'en') {
        const en = DICT[trimmed];
        if (en != null) {
          // Preserve leading/trailing whitespace
          const lead = original.match(/^\s*/)[0];
          const trail = original.match(/\s*$/)[0];
          node.nodeValue = lead + en + trail;
        } else {
          // No translation — keep PT
          node.nodeValue = original;
        }
      } else {
        node.nodeValue = original;
      }
    }
  }

  function translateAttributes(root, lang) {
    const sel = '[placeholder],[title],[aria-label],[alt]';
    const els = root.querySelectorAll ? Array.from(root.querySelectorAll(sel)) : [];
    if (root.matches && root.matches(sel)) els.unshift(root);
    for (const el of els) {
      for (const attr of ['placeholder', 'title', 'aria-label', 'alt']) {
        if (!el.hasAttribute(attr)) continue;
        const storeKey = '__rds_pt_' + attr;
        const original = el[storeKey] || el.getAttribute(attr);
        if (!el[storeKey]) el[storeKey] = original;
        const trimmed = original.trim();
        const en = ATTR_DICT[trimmed] || DICT[trimmed];
        if (lang === 'en' && en != null) {
          el.setAttribute(attr, en);
        } else {
          el.setAttribute(attr, original);
        }
      }
    }
  }

  function translateTitleAndMeta(lang) {
    // Title
    if (!document.__rds_pt_title) document.__rds_pt_title = document.title;
    const ptTitle = document.__rds_pt_title.trim();
    if (lang === 'en' && PAGE_META[ptTitle]) {
      document.title = PAGE_META[ptTitle];
    } else {
      document.title = document.__rds_pt_title;
    }
    // Meta description
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      if (!meta.__rds_pt) meta.__rds_pt = meta.getAttribute('content') || '';
      const pt = meta.__rds_pt.trim();
      const en = DICT[pt];
      if (lang === 'en' && en) meta.setAttribute('content', en);
      else meta.setAttribute('content', meta.__rds_pt);
    }
  }

  function applyLang(root) {
    const lang = getLang();
    translateTextNodes(root || document.body, lang);
    translateAttributes(root || document.body, lang);
    if (!root) translateTitleAndMeta(lang);
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
  }

  // ─── LANGUAGE SWITCHER ──────────────────────────────────
  function injectSwitcher() {
    const nav = document.querySelector('nav.top');
    if (!nav || document.getElementById('rds-lang-switch')) return;
    const sw = document.createElement('div');
    sw.id = 'rds-lang-switch';
    sw.setAttribute('role', 'group');
    sw.setAttribute('aria-label', 'Language');
    sw.innerHTML = `
      <button type="button" data-lang="pt" aria-label="Português">PT</button>
      <span class="rds-sep">/</span>
      <button type="button" data-lang="en" aria-label="English">EN</button>
    `;
    // Insert before the .cta link
    const cta = nav.querySelector('.cta');
    if (cta) nav.insertBefore(sw, cta);
    else nav.appendChild(sw);

    sw.addEventListener('click', e => {
      const btn = e.target.closest('button[data-lang]');
      if (!btn) return;
      setLang(btn.dataset.lang);
    });
  }

  function updateSwitcher() {
    const sw = document.getElementById('rds-lang-switch');
    if (!sw) return;
    const lang = getLang();
    sw.querySelectorAll('button').forEach(b => {
      b.classList.toggle('on', b.dataset.lang === lang);
    });
  }

  function injectStyles() {
    if (document.getElementById('rds-i18n-styles')) return;
    const style = document.createElement('style');
    style.id = 'rds-i18n-styles';
    style.textContent = `
      #rds-lang-switch {
        display: inline-flex; align-items: center; gap: 6px;
        font-family: 'Geist Mono', ui-monospace, monospace;
        font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
        margin-right: 8px;
      }
      #rds-lang-switch button {
        background: transparent; border: 0; padding: 6px 8px; cursor: pointer;
        color: inherit; opacity: 0.45; font: inherit; letter-spacing: inherit;
        text-transform: inherit; transition: opacity 0.2s, color 0.2s;
        border-radius: 6px;
      }
      #rds-lang-switch button:hover { opacity: 0.9; }
      #rds-lang-switch button.on { opacity: 1; color: var(--ember, #d6422a); font-weight: 600; }
      #rds-lang-switch .rds-sep { opacity: 0.25; font-weight: 300; }
      @media (max-width: 720px) {
        #rds-lang-switch { margin-right: 4px; font-size: 10px; }
        #rds-lang-switch button { padding: 4px 6px; }
      }
    `;
    document.head.appendChild(style);
  }

  // ─── BOOTSTRAP ──────────────────────────────────────────
  function init() {
    injectStyles();
    injectSwitcher();
    updateSwitcher();
    applyLang();

    // Observe DOM changes — translate new content (e.g. loja products).
    let scheduled = false;
    const observer = new MutationObserver(muts => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        for (const m of muts) {
          if (m.type === 'childList') {
            m.addedNodes.forEach(n => {
              if (n.nodeType === 1) {
                if (n.id === 'rds-lang-switch' || n.closest && n.closest('#rds-lang-switch')) return;
                applyLang(n);
              }
            });
          }
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
