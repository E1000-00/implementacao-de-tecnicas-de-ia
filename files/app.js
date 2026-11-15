// app.js — interface: lê o formulário, controla a execução e desenha o grafo.
// O algoritmo está em aco.js e a validação em validacao.js.

const $ = id => document.getElementById(id);
const fmt = (n, casas = 4) => n.toLocaleString('pt-BR', { maximumFractionDigits: casas });

// ---------- Valores iniciais ----------
const CAMPOS = [
  { id: 'formigas',  rotulo: 'Número de formigas (1–100)',          valor: 10 },
  { id: 'iteracoes', rotulo: 'Número de iterações (1–200)',          valor: 30 },
  { id: 'alfa',      rotulo: 'Influência do feromônio α (0–5)',      valor: 1 },
  { id: 'beta',      rotulo: 'Influência da distância β (0–5)',      valor: 2 },
  { id: 'rho',       rotulo: 'Taxa de evaporação ρ (0–90 %)',        valor: 50 },
  { id: 'tau0',      rotulo: 'Feromônio inicial τ₀ (0,01–100)',      valor: 1 },
  { id: 'Q',         rotulo: 'Constante de depósito Q (0,01–10000)', valor: 2500 },
  { id: 'semente',   rotulo: 'Semente aleatória (inteiro)',          valor: 42 },
];
const VERTICES_INICIAIS = [['A', 100, 100], ['B', 200, 600], ['C', 400, 850], ['D', 650, 750],
                           ['E', 850, 500], ['F', 750, 150], ['G', 450, 300]];
const INSTANCIA_6_1 = [['A', 0, 0], ['B', 3, 0], ['C', 3, 4], ['D', 0, 4]];
const PARAMETROS_6_4 = { formigas: 10, iteracoes: 30, alfa: 1, beta: 2, rho: 50, tau0: 1, Q: 14, semente: 42 };

// ---------- Estado da tela ----------
let estado = null;         // estado do algoritmo; null quando o formulário é inválido
let desatualizado = false; // true se o formulário mudou desde o último "Reiniciar"
let rodando = false;
let temporizador = null;

// ---------- Formulário ----------
function criarCampos() {
  $('campos').innerHTML = CAMPOS.map(c =>
    `<label>${c.rotulo}<input id="${c.id}" value="${c.valor}" inputmode="decimal"></label>`).join('');
}

function adicionarLinhaVertice(id, x, y) {
  const linha = document.createElement('tr');
  linha.innerHTML = `
    <td><input class="v-id" value="${id}" maxlength="8"></td>
    <td><input class="v-x" value="${x}" inputmode="decimal"></td>
    <td><input class="v-y" value="${y}" inputmode="decimal"></td>
    <td><button type="button" class="btn-remover" title="Remover vértice">✕</button></td>`;
  $('tabela-vertices').querySelector('tbody').appendChild(linha);
}

function preencherVertices(lista) {
  $('tabela-vertices').querySelector('tbody').replaceChildren();
  lista.forEach(([id, x, y]) => adicionarLinhaVertice(id, x, y));
  atualizarOpcoesDeposito();
}

// O seletor de depósito sempre lista os identificadores digitados na tabela.
function atualizarOpcoesDeposito() {
  const select = $('deposito');
  const anterior = select.value;
  const ids = [...document.querySelectorAll('.v-id')].map(campo => campo.value.trim()).filter(Boolean);
  select.replaceChildren(...ids.map(id => new Option(id)));
  if (ids.includes(anterior)) select.value = anterior;
}

function lerFormulario() {
  const vertices = [...document.querySelectorAll('#tabela-vertices tbody tr')].map(linha => ({
    id: linha.querySelector('.v-id').value.trim(),
    x: linha.querySelector('.v-x').value,
    y: linha.querySelector('.v-y').value,
  }));
  const entrada = { vertices, deposito: $('deposito').value };
  for (const campo of CAMPOS) entrada[campo.id] = $(campo.id).value;
  return entrada;
}

function mostrarMensagens(lista) {
  $('mensagens').replaceChildren(...lista.map(texto => {
    const item = document.createElement('li');
    item.textContent = texto;
    return item;
  }));
}

// ---------- Controles ----------
const terminou = () => estado.iteracao >= estado.config.iteracoes;

function atualizarBotoes() {
  const pronto = estado && !desatualizado;
  const podeAvancar = pronto && !rodando && !terminou();
  $('btn-executar').disabled = !podeAvancar;
  $('btn-avancar').disabled = !podeAvancar;
  $('btn-pausar').disabled = !rodando;
}

function marcarAlterado() {
  pausar();
  desatualizado = true;
  mostrarMensagens(['Dados ou parâmetros alterados: clique em Reiniciar para aplicar.']);
  atualizarBotoes();
}

function reiniciar() {
  pausar();
  const { erros, config } = validar(lerFormulario());
  mostrarMensagens(erros);
  estado = erros.length === 0 ? criarEstado(config) : null;
  desatualizado = false;
  $('tabela-historico').querySelector('tbody').replaceChildren();
  $('detalhes').replaceChildren();
  redesenhar();
}

function avancarIteracao() {
  const registro = executarIteracao(estado);
  adicionarLinhaHistorico(registro);
  mostrarDetalhes(registro);
  redesenhar();
}

function executar() {
  rodando = true;
  atualizarBotoes();
  (function passo() {
    if (!rodando) return;
    avancarIteracao();
    if (terminou()) { rodando = false; atualizarBotoes(); return; }
    temporizador = setTimeout(passo, Number($('velocidade').value)); // a velocidade só muda o ritmo da tela
  })();
}

function pausar() {
  rodando = false;
  clearTimeout(temporizador);
  atualizarBotoes();
}

// ---------- Métricas e histórico ----------
const nomesDaRota = rota => rota.map(i => estado.config.vertices[i].id).join(' → ');

function mostrarMetricas() {
  const ultimo = estado.historico[estado.historico.length - 1];
  const naoCalculada = 'ainda não calculada';
  $('m-iteracao').textContent = `${estado.iteracao} de ${estado.config.iteracoes}`;
  $('m-menor').textContent = ultimo ? fmt(ultimo.menor) : naoCalculada;
  $('m-media').textContent = ultimo ? fmt(ultimo.media) : naoCalculada;
  $('m-melhor').textContent = estado.melhor ? fmt(estado.melhor.comprimento) : naoCalculada;
  $('m-rota').textContent = estado.melhor ? nomesDaRota(estado.melhor.rota) : naoCalculada;
}

function adicionarLinhaHistorico(registro) {
  const linha = document.createElement('tr');
  linha.innerHTML = `<td>${registro.iteracao}</td><td>${fmt(registro.menor)}</td><td>${fmt(registro.media)}</td>
    <td>${fmt(registro.melhorAcumulada)}</td><td>${nomesDaRota(registro.melhorRota)}</td>`;
  linha.addEventListener('click', () => mostrarDetalhes(registro));
  $('tabela-historico').querySelector('tbody').appendChild(linha);
}

// Log da iteração: construção da rota da formiga 1, rota de cada formiga e feromônio por aresta.
function mostrarDetalhes(registro) {
  const nome = i => estado.config.vertices[i].id;
  const formiga1 = registro.formigas[0];
  const passos = formiga1.passos.map(p => {
    const candidatos = p.opcoes
      .map(o => `${nome(o.vertice)} (w=${fmt(o.peso, 6)}, p=${fmt(o.probabilidade * 100, 2)}%)`).join('; ');
    return `<li>Em ${nome(p.atual)}: candidatos ${candidatos} → escolhido <b>${nome(p.escolhido)}</b></li>`;
  }).join('');
  const rotas = registro.formigas.map((f, k) =>
    `<li>Formiga ${k + 1}: ${nomesDaRota(f.rota)} — comprimento ${fmt(f.comprimento)}</li>`).join('');
  const arestas = registro.arestas.map(a => `<tr><td>${nome(a.i)}–${nome(a.j)}</td><td>${fmt(a.anterior, 6)}</td>
    <td>${fmt(a.aposEvap, 6)}</td><td>${fmt(a.deposito, 6)}</td><td>${fmt(a.final, 6)}</td></tr>`).join('');

  $('detalhes').innerHTML = `
    <h2>Log da iteração ${registro.iteracao}</h2>
    <details open><summary>Construção da rota da formiga 1</summary>
      <ol>${passos}<li>Todos visitados: retorno ao depósito ${nome(formiga1.rota[0])}</li></ol></details>
    <details><summary>Rota e comprimento de cada formiga</summary><ul>${rotas}</ul></details>
    <details><summary>Feromônio por aresta</summary>
      <table><thead><tr><th>Aresta</th><th>Anterior</th><th>Após evaporação</th><th>Depósito total</th><th>Final</th></tr></thead>
      <tbody>${arestas}</tbody></table></details>`;
}

// ---------- Grafo (SVG) ----------
const SVG_NS = 'http://www.w3.org/2000/svg';

function criarSvg(tag, atributos, pai) {
  const elemento = document.createElementNS(SVG_NS, tag);
  for (const [nome, valor] of Object.entries(atributos)) elemento.setAttribute(nome, valor);
  pai.appendChild(elemento);
  return elemento;
}

const posicao = v => ({ x: v.x, y: 1000 - v.y }); // y para cima, como no plano cartesiano

function maiorFeromonio() {
  let maior = 0;
  for (const linha of estado.tau) for (const t of linha) maior = Math.max(maior, t);
  return maior;
}

function mostrarAresta(i, j) {
  const { vertices } = estado.config;
  $('info-aresta').textContent = `Aresta ${vertices[i].id}–${vertices[j].id}: distância ${fmt(estado.dist[i][j])}; feromônio ${fmt(estado.tau[i][j], 6)}`;
}

function desenharGrafo() {
  const svg = $('grafo');
  svg.replaceChildren();
  $('info-aresta').textContent = 'Passe o cursor sobre uma aresta.';
  $('escala').textContent = '';
  if (!estado) return;

  const { vertices, deposito } = estado.config;
  const tauMax = maiorFeromonio();
  $('escala').textContent = `maior agora: ${fmt(tauMax, 6)}`;

  // 1) todas as arestas: espessura e opacidade proporcionais ao feromônio
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const p = posicao(vertices[i]), q = posicao(vertices[j]);
      const proporcao = estado.tau[i][j] / tauMax;
      const reta = { x1: p.x, y1: p.y, x2: q.x, y2: q.y };
      criarSvg('line', { ...reta, stroke: '#6b7280', 'stroke-width': 0.5 + 6 * proporcao, 'stroke-opacity': 0.15 + 0.6 * proporcao }, svg);
      const area = criarSvg('line', { ...reta, stroke: 'transparent', 'stroke-width': 16 }, svg); // facilita o cursor
      area.addEventListener('mouseenter', () => mostrarAresta(i, j));
    }
  }

  // 2) melhor rota acumulada, destacada por cima
  if (estado.melhor) {
    const pontos = estado.melhor.rota.map(i => { const p = posicao(vertices[i]); return `${p.x},${p.y}`; }).join(' ');
    criarSvg('polyline', { points: pontos, fill: 'none', stroke: '#f97316', 'stroke-width': 5, 'pointer-events': 'none' }, svg);
  }

  // 3) vértices; o depósito é azul
  vertices.forEach((v, i) => {
    const p = posicao(v);
    const ehDeposito = i === deposito;
    criarSvg('circle', { cx: p.x, cy: p.y, r: 28, fill: ehDeposito ? '#2563eb' : '#fff', stroke: '#1e3a8a', 'stroke-width': 3 }, svg);
    criarSvg('text', { x: p.x, y: p.y, fill: ehDeposito ? '#fff' : '#1e3a8a' }, svg).textContent = v.id;
  });
}

function redesenhar() {
  desenharGrafo();
  if (estado) {
    mostrarMetricas();
  } else {
    ['m-iteracao', 'm-menor', 'm-media', 'm-melhor', 'm-rota'].forEach(id => { $(id).textContent = '—'; });
  }
  atualizarBotoes();
}

// ---------- Ligação dos eventos ----------
$('btn-executar').addEventListener('click', executar);
$('btn-pausar').addEventListener('click', pausar);
$('btn-avancar').addEventListener('click', avancarIteracao);
$('btn-reiniciar').addEventListener('click', reiniciar);

$('btn-adicionar').addEventListener('click', () => {
  const ids = [...document.querySelectorAll('.v-id')].map(campo => campo.value.trim());
  const proximoId = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].find(letra => !ids.includes(letra)) || 'V' + ids.length;
  const n = ids.length;
  adicionarLinhaVertice(proximoId, (n * 173 + 61) % 1000, (n * 311 + 127) % 1000);
  atualizarOpcoesDeposito();
  marcarAlterado();
});

$('btn-referencia').addEventListener('click', () => {
  preencherVertices(INSTANCIA_6_1);
  for (const [id, valor] of Object.entries(PARAMETROS_6_4)) $(id).value = valor;
  $('deposito').value = 'A';
  reiniciar();
});

$('tabela-vertices').addEventListener('click', evento => {
  if (!evento.target.classList.contains('btn-remover')) return;
  evento.target.closest('tr').remove();
  atualizarOpcoesDeposito();
  marcarAlterado();
});

$('dados').addEventListener('input', evento => {
  if (evento.target.classList.contains('v-id')) atualizarOpcoesDeposito();
  marcarAlterado();
});

criarCampos();
preencherVertices(VERTICES_INICIAIS);
reiniciar();
