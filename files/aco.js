// aco.js — Ant System para a rota de entregas.
// Aqui só existe lógica (nada mexe na tela), então o mesmo arquivo roda no navegador e nos testes (Node).

const PISO_FEROMONIO = 1e-12; // proteção contra feromônio numericamente nulo

// Gerador pseudoaleatório com semente (mulberry32): mesma semente = mesma sequência.
function criarGerador(semente) {
  let s = semente >>> 0;
  return function sortear01() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function criarMatriz(n, valorDe) {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => valorDe(i, j)));
}

// Distância euclidiana entre todos os pares de vértices.
function calcularDistancias(vertices) {
  return criarMatriz(vertices.length, (i, j) =>
    Math.hypot(vertices[i].x - vertices[j].x, vertices[i].y - vertices[j].y));
}

// Soma as distâncias de uma rota [depósito, ..., depósito], incluindo o retorno.
function comprimentoRota(rota, dist) {
  let total = 0;
  for (let k = 0; k < rota.length - 1; k++) total += dist[rota[k]][rota[k + 1]];
  return total;
}

// Peso w = τ^α · (1/d)^β  e  probabilidade p = w / (soma dos pesos dos candidatos).
function calcularProbabilidades(atual, candidatos, tau, dist, alfa, beta) {
  const pesos = candidatos.map(j => Math.pow(tau[atual][j], alfa) * Math.pow(1 / dist[atual][j], beta));
  const soma = pesos.reduce((a, b) => a + b, 0);
  return candidatos.map((j, k) => ({ vertice: j, peso: pesos[k], probabilidade: pesos[k] / soma }));
}

// Sorteio proporcional (roleta): não escolhe sempre o maior peso.
function sortearOpcao(opcoes, sortear01) {
  const r = sortear01();
  let acumulado = 0;
  for (const opcao of opcoes) {
    acumulado += opcao.probabilidade;
    if (r < acumulado) return opcao;
  }
  return opcoes[opcoes.length - 1]; // sobra de arredondamento
}

// Uma formiga constrói a rota completa. 'passos' guarda o que ela viu em cada escolha (para o log).
function construirRota(deposito, tau, dist, params, sortear01) {
  const naoVisitados = new Set(dist.keys());
  naoVisitados.delete(deposito);
  const rota = [deposito];
  const passos = [];
  while (naoVisitados.size > 0) {
    const atual = rota[rota.length - 1];
    const opcoes = calcularProbabilidades(atual, [...naoVisitados], tau, dist, params.alfa, params.beta);
    const escolhida = sortearOpcao(opcoes, sortear01);
    passos.push({ atual, opcoes, escolhido: escolhida.vertice });
    rota.push(escolhida.vertice);
    naoVisitados.delete(escolhida.vertice);
  }
  rota.push(deposito); // retorno obrigatório ao depósito
  return { rota, passos, comprimento: comprimentoRota(rota, dist) };
}

// Evaporação + depósito de todas as formigas, aplicados só depois que todas terminaram.
// Devolve, para cada aresta, o log: anterior, após evaporação, depósito total e final.
function atualizarFeromonio(tau, formigas, params) {
  const n = tau.length;
  const depositos = criarMatriz(n, () => 0);
  for (const formiga of formigas) {
    const delta = params.Q / formiga.comprimento; // Δτ = Q / L
    for (let k = 0; k < formiga.rota.length - 1; k++) {
      const a = formiga.rota[k], b = formiga.rota[k + 1];
      depositos[a][b] += delta;
      depositos[b][a] += delta; // grafo não direcionado: τ(i,j) = τ(j,i)
    }
  }
  const arestas = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const anterior = tau[i][j];
      const aposEvap = (1 - params.rho) * anterior;
      const valorFinal = Math.max(aposEvap + depositos[i][j], PISO_FEROMONIO);
      tau[i][j] = tau[j][i] = valorFinal;
      arestas.push({ i, j, anterior, aposEvap, deposito: depositos[i][j], final: valorFinal });
    }
  }
  return arestas;
}

// 'config' vem da validação: vértices, deposito (índice), formigas, iteracoes, alfa, beta,
// rho (fração, 0,5 = 50%), tau0, Q e semente.
function criarEstado(config) {
  return {
    config,
    dist: calcularDistancias(config.vertices),
    tau: criarMatriz(config.vertices.length, (i, j) => (i === j ? 0 : config.tau0)), // diagonal sem feromônio
    sortear01: criarGerador(config.semente),
    iteracao: 0,
    melhor: null, // melhor rota de toda a execução (null = ainda não calculada)
    historico: [],
  };
}

// Executa uma iteração. 'rotasForcadas' (opcional) serve só para os testes controlados.
function executarIteracao(estado, rotasForcadas) {
  const { config, dist, tau } = estado;
  const quantidade = rotasForcadas ? rotasForcadas.length : config.formigas;
  const formigas = [];
  for (let k = 0; k < quantidade; k++) {
    formigas.push(rotasForcadas
      ? { rota: rotasForcadas[k], passos: [], comprimento: comprimentoRota(rotasForcadas[k], dist) }
      : construirRota(config.deposito, tau, dist, config, estado.sortear01));
  }
  const arestas = atualizarFeromonio(tau, formigas, config); // todas usaram o mesmo τ até aqui

  const comprimentos = formigas.map(f => f.comprimento);
  const menor = Math.min(...comprimentos);
  const melhorDaIteracao = formigas[comprimentos.indexOf(menor)];
  if (!estado.melhor || menor < estado.melhor.comprimento) {
    estado.melhor = { rota: melhorDaIteracao.rota, comprimento: menor };
  }
  estado.iteracao++;
  const registro = {
    iteracao: estado.iteracao,
    formigas, arestas, menor,
    melhorRota: melhorDaIteracao.rota,
    media: comprimentos.reduce((a, b) => a + b, 0) / comprimentos.length,
    melhorAcumulada: estado.melhor.comprimento,
  };
  estado.historico.push(registro);
  return registro;
}

const ACO = { criarGerador, calcularDistancias, comprimentoRota, calcularProbabilidades, construirRota,
              atualizarFeromonio, criarEstado, executarIteracao };
if (typeof module !== 'undefined') module.exports = ACO; // uso nos testes (Node)
