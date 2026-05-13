/* RedDune — Loja products mock
   Quando integrares a dashboard, este array é substituído por dados reais.
   Para testar o estado vazio, deixa o array a []. */

window.LOJA_PRODUCTS = [
  {
    id: 'pc-ryzen7-rtx4070',
    name: 'PC Gaming Ryzen 7 + RTX 4070',
    category: 'Computadores',
    condition: 'novo',
    brand: 'Custom build',
    price: 1450,
    desc: 'Build gaming alto-desempenho montada peça a peça, com testes de estabilidade e overclock incluído.',
    specs: ['AMD Ryzen 7 7700X', '32 GB DDR5 6000 MHz', 'NVIDIA RTX 4070 12 GB', '1 TB NVMe PCIe 4.0'],
    stock: 1,
    addedAt: '2026-05-08',
    palette: ['#e89968', '#a8201a']
  },
  {
    id: 'pc-workstation',
    name: 'Workstation Threadripper',
    category: 'Computadores',
    condition: 'novo',
    brand: 'Custom build',
    price: 2890,
    desc: 'Workstation para edição de vídeo 4K, modelação 3D e renders longos.',
    specs: ['AMD Threadripper 7960X', '64 GB DDR5 ECC', 'NVIDIA RTX 4080 Super', '2 TB NVMe + 4 TB HDD'],
    stock: 1,
    addedAt: '2026-04-22',
    palette: ['#c97045', '#5a0e0e']
  },
  {
    id: 'macbook-air-m1-recond',
    name: 'MacBook Air M1 13" 256 GB',
    category: 'Portáteis',
    condition: 'recondicionado',
    brand: 'Apple',
    price: 680,
    desc: 'MacBook Air M1 recondicionado: SSD, bateria e teclado revistos. 6 meses de garantia.',
    specs: ['Apple M1 8-core', '8 GB unified memory', '256 GB SSD', 'macOS Sonoma'],
    stock: 1,
    addedAt: '2026-05-10',
    palette: ['#f3c79b', '#7a1410']
  },
  {
    id: 'asus-rog-strix-rtx4060',
    name: 'Portátil Gaming ASUS ROG Strix',
    category: 'Portáteis',
    condition: 'novo',
    brand: 'ASUS',
    price: 1290,
    desc: 'Portátil gaming 15.6" com painel 165 Hz e refrigeração reforçada para sessões longas.',
    specs: ['Intel Core i7-13650HX', '16 GB DDR5', 'NVIDIA RTX 4060 8 GB', '1 TB NVMe · ecrã 165 Hz'],
    stock: 2,
    addedAt: '2026-04-30',
    palette: ['#d6422a', '#3a0a08']
  },
  {
    id: 'teclado-keychron-k2',
    name: 'Teclado Mecânico Keychron K2',
    category: 'Periféricos',
    condition: 'novo',
    brand: 'Keychron',
    price: 89,
    desc: 'Teclado mecânico sem-fios, 75% layout, hot-swap, retroiluminação RGB.',
    specs: ['Layout PT', 'Switches Gateron Brown', 'Hot-swap PCB', 'Bluetooth + USB-C'],
    stock: 3,
    addedAt: '2026-05-05',
    palette: ['#a8201a', '#1a0805']
  },
  {
    id: 'rato-logitech-mx-master-3s',
    name: 'Rato Logitech MX Master 3S',
    category: 'Periféricos',
    condition: 'novo',
    brand: 'Logitech',
    price: 109,
    desc: 'Rato ergonómico de produtividade — scroll silencioso, multi-device.',
    specs: ['Sensor 8000 DPI', 'Scroll MagSpeed', 'Multi-dispositivo (3)', 'USB-C 70 dias bat.'],
    stock: 4,
    addedAt: '2026-05-02',
    palette: ['#e89968', '#5a0e0e']
  },
  {
    id: 'ssd-samsung-980pro-1tb',
    name: 'SSD Samsung 980 Pro 1 TB',
    category: 'Componentes',
    condition: 'novo',
    brand: 'Samsung',
    price: 119,
    desc: 'SSD NVMe Gen4 de alto desempenho para gaming e produtividade.',
    specs: ['M.2 2280 · PCIe Gen4', '7 000 MB/s leitura', '5 000 MB/s escrita', 'Garantia 5 anos fabricante'],
    stock: 5,
    addedAt: '2026-05-09',
    palette: ['#7a1410', '#1a0805']
  },
  {
    id: 'ram-kingston-fury-32gb',
    name: 'RAM Kingston Fury 32 GB DDR5',
    category: 'Componentes',
    condition: 'novo',
    brand: 'Kingston',
    price: 145,
    desc: 'Kit 2×16 GB DDR5 6000 MHz com perfis EXPO e XMP prontos a usar.',
    specs: ['2×16 GB DDR5', '6 000 MHz CL36', 'EXPO + XMP 3.0', 'Dissipador de alumínio'],
    stock: 3,
    addedAt: '2026-04-28',
    palette: ['#c97045', '#3a0a08']
  },
  {
    id: 'monitor-lg-27-usado',
    name: 'Monitor LG UltraWide 29" (usado)',
    category: 'Periféricos',
    condition: 'usado',
    brand: 'LG',
    price: 180,
    desc: 'Monitor ultrawide 29" IPS — pequenas marcas de uso no traseiro, ecrã impecável.',
    specs: ['29" IPS 21:9', '2560 × 1080 75 Hz', 'HDMI + DisplayPort', 'Suporte VESA'],
    stock: 1,
    addedAt: '2026-05-11',
    palette: ['#5a0e0e', '#1a0805']
  },
  {
    id: 'router-tplink-eap610',
    name: 'TP-Link EAP610 Access Point',
    category: 'Rede',
    condition: 'novo',
    brand: 'TP-Link',
    price: 95,
    desc: 'Access point Wi-Fi 6 AX1800 para PME — montagem em teto, PoE.',
    specs: ['Wi-Fi 6 AX1800', 'PoE 802.3af', 'Gestão Omada Cloud', 'Até 100 utilizadores'],
    stock: 2,
    addedAt: '2026-04-15',
    palette: ['#a8201a', '#2a0805']
  }
];
