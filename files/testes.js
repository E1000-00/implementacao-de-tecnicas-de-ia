// testes.js — executa os testes de validação 6.1 a 6.5.   Uso: node testes.js
const ACO = require('./aco.js');
const { validar } = require('./validacao.js');

let falhas = 0;
function conferir(descricao, ok, detalhe = '') {
  console.log(`${ok ? 'OK    ' : 'FALHOU'} ${descricao}  ${detalhe}`);
  if (!ok) falhas++;
}
const quase = (a, b) => Math.abs(a - b) <= 1e-6; // tolerância absoluta pedida no enunciado

const retangulo = [{ id: 'A', x: 0, y: 0 }, { id: 'B', x: 3, y: 0 }, { id: 'C', x: 3, y: 4 }, { id: 'D', x: 0, y: 4 }];
const parametros = { formigas: 10, iteracoes: 30, alfa: 1, beta: 2, rho: 0.5, tau0: 1, Q: 14, semente: 42 };
const criar = (extra = {}) => ACO.criarEstado({ vertices: retangulo, deposito: 0, ...parametros, ...extra });
const nomes = rota => rota.map(i => retangulo[i].id).join('→');

function executarTudo(extra) {
  const estado = criar(extra);
  while (estado.iteracao < estado.config.iteracoes) ACO.executarIteracao(estado);
  return estado;
}

function teste61() {
  const dist = ACO.calcularDistancias(retangulo);
  const casos = [[[0, 1, 2, 3, 0], 14], [[0, 1, 3, 2, 0], 16], [[0, 2, 1, 3, 0], 18],
                 [[0, 2, 3, 1, 0], 16], [[0, 3, 1, 2, 0], 18], [[0, 3, 2, 1, 0], 14]];
  for (const [rota, esperado] of casos) {
    const obtido = ACO.comprimentoRota(rota, dist);
    conferir(`6.1 ${nomes(rota)} = ${esperado}`, quase(obtido, esperado), `obtido ${obtido}`);
  }
  const simetrica = dist.every((linha, i) => linha.every((d, j) => d === dist[j][i] && (i !== j || d === 0)));
  conferir('6.1 distâncias simétricas e d(i,i) = 0', simetrica);
}

function teste62() {
  const { tau, dist } = criar();
  const deA = ACO.calcularProbabilidades(0, [1, 2, 3], tau, dist, 1, 2);
  conferir('6.2 pesos w(A,B), w(A,C), w(A,D) = 1/9, 1/25, 1/16',
    quase(deA[0].peso, 1 / 9) && quase(deA[1].peso, 1 / 25) && quase(deA[2].peso, 1 / 16));
  conferir('6.2 p(A,·) = 400/769, 144/769, 225/769 (soma 1)',
    quase(deA[0].probabilidade, 400 / 769) && quase(deA[1].probabilidade, 144 / 769) &&
    quase(deA[2].probabilidade, 225 / 769) && quase(deA.reduce((s, o) => s + o.probabilidade, 0), 1),
    deA.map(o => o.probabilidade.toFixed(6)).join(' '));
  const deB = ACO.calcularProbabilidades(1, [2, 3], tau, dist, 1, 2);
  conferir('6.2 p(B,C) = 25/41 e p(B,D) = 16/41', quase(deB[0].probabilidade, 25 / 41) && quase(deB[1].probabilidade, 16 / 41),
    deB.map(o => o.probabilidade.toFixed(6)).join(' '));
  const zero = ACO.calcularProbabilidades(0, [1, 2, 3], tau, dist, 0, 0);
  conferir('6.2 α = 0 e β = 0: probabilidades iguais', zero.every(o => quase(o.probabilidade, 1 / 3)));
  conferir('6.2 um único candidato: p = 1', ACO.calcularProbabilidades(2, [3], tau, dist, 1, 2)[0].probabilidade === 1);
}

function teste63() {
  const rota = [0, 1, 2, 3, 0];
  const perimetro = [[0, 1], [1, 2], [2, 3], [0, 3]], diagonais = [[0, 2], [1, 3]];
  const todos = (est, pares, valor) => pares.every(([i, j]) => quase(est.tau[i][j], valor) && quase(est.tau[j][i], valor));
  const aresta = (reg, i, j) => reg.arestas.find(a => a.i === i && a.j === j);

  const est = criar({ formigas: 1 });
  const reg = ACO.executarIteracao(est, [rota]);
  const ab = aresta(reg, 0, 1), ac = aresta(reg, 0, 2);
  conferir('6.3 log AB: anterior 1; evaporação 0,5; depósito 1; final 1,5',
    quase(ab.anterior, 1) && quase(ab.aposEvap, 0.5) && quase(ab.deposito, 1) && quase(ab.final, 1.5),
    `anterior ${ab.anterior}; após evaporação ${ab.aposEvap}; depósito ${ab.deposito}; final ${ab.final}`);
  conferir('6.3 log AC: anterior 1; evaporação 0,5; depósito 0; final 0,5',
    quase(ac.anterior, 1) && quase(ac.aposEvap, 0.5) && quase(ac.deposito, 0) && quase(ac.final, 0.5),
    `anterior ${ac.anterior}; após evaporação ${ac.aposEvap}; depósito ${ac.deposito}; final ${ac.final}`);
  conferir('6.3 iteração 1: perímetro 1,5 e diagonais 0,5', todos(est, perimetro, 1.5) && todos(est, diagonais, 0.5));
  ACO.executarIteracao(est, [rota]);
  conferir('6.3 iteração 2: perímetro 1,75 e diagonais 0,25', todos(est, perimetro, 1.75) && todos(est, diagonais, 0.25));

  const dupla = criar({ formigas: 2 });
  ACO.executarIteracao(dupla, [rota, rota]);
  conferir('6.3 duas formigas: perímetro 2,5 e diagonais 0,5', todos(dupla, perimetro, 2.5) && todos(dupla, diagonais, 0.5));
  conferir('6.3 diagonal da matriz sem feromônio', dupla.tau.every((linha, i) => linha[i] === 0));

  const semEvap = criar({ rho: 0 });
  const r = ACO.executarIteracao(semEvap);
  conferir('6.5 ρ = 0%: a evaporação não reduz o feromônio', r.arestas.every(a => a.aposEvap === a.anterior && a.final >= a.anterior));
}

function teste64() {
  conferir('6.4 iteração 0: melhor distância ainda não calculada (null)', criar().melhor === null);
  const a = executarTudo(), b = executarTudo();
  const resumo = est => JSON.stringify(est.historico.map(r => [r.menor, r.media, r.melhorAcumulada]));
  const acumuladas = a.historico.map(r => r.melhorAcumulada);
  conferir('6.4 30 registros, um por iteração', a.historico.length === 30);
  conferir('6.4 melhor acumulada nunca aumenta', acumuladas.every((d, k) => k === 0 || d <= acumuladas[k - 1]));
  conferir('6.4 comprimento final em {14, 16, 18}', [14, 16, 18].some(v => quase(a.melhor.comprimento, v)),
    `melhor rota ${nomes(a.melhor.rota)} = ${a.melhor.comprimento}`);
  conferir('6.4 mesma semente reproduz o histórico', resumo(a) === resumo(b));
}

function teste65() {
  for (const beta of [0, 2]) {
    const finais = [1, 2, 3, 4, 5].map(semente => executarTudo({ beta, semente }).melhor.comprimento);
    const media = finais.reduce((s, d) => s + d, 0) / finais.length;
    const otimas = finais.filter(d => quase(d, 14)).length;
    console.log(`INFO   6.5 β = ${beta}: finais [${finais.join(', ')}]; média ${media}; atingiram 14: ${otimas}/5`);
  }
  const base = () => ({
    vertices: retangulo.map(v => ({ id: v.id, x: String(v.x), y: String(v.y) })),
    deposito: 'A', formigas: '10', iteracoes: '30', alfa: '1', beta: '2', rho: '50', tau0: '1', Q: '14', semente: '42',
  });
  conferir('6.5 entrada válida não gera erros', validar(base()).erros.length === 0);
  const invalidos = [
    ['coordenadas duplicadas', e => { e.vertices[1].x = '0'; e.vertices[1].y = '0'; }],
    ['identificador repetido', e => { e.vertices[1].id = 'A'; }],
    ['menos de quatro vértices', e => { e.vertices.pop(); }],
    ['campo vazio', e => { e.formigas = ''; }],
    ['α fora do intervalo', e => { e.alfa = '6'; }],
    ['ρ fora do intervalo', e => { e.rho = '95'; }],
    ['coordenada com três casas decimais', e => { e.vertices[0].x = '1.234'; }],
    ['coordenada acima de 1000', e => { e.vertices[0].y = '1001'; }],
  ];
  for (const [descricao, alterar] of invalidos) {
    const entrada = base();
    alterar(entrada);
    const { erros } = validar(entrada);
    conferir(`6.5 bloqueia: ${descricao}`, erros.length > 0, `→ "${erros[0]}"`);
  }
}

teste61(); teste62(); teste63(); teste64(); teste65();
console.log(falhas === 0 ? '\nTodos os testes passaram.' : `\n${falhas} teste(s) falharam.`);
process.exit(falhas === 0 ? 0 : 1);
