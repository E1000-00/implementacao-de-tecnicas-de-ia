// Uso: node test.js > resultados-testes.md
const GA = require('./ga.js');
const P = [['Melhoria da iluminação', 4000, 7], ['Instalação de bicicletários', 3000, 5],
  ['Aquisição de bancos', 2000, 3], ['Reforma de espaço de convivência', 5000, 8]].map(p => GA.proj(...p));
const B = 700000, c = s => [...s].map(Number), f = GA.fmt;
const R = v => 'R$ ' + (v / 100).toLocaleString('pt-BR');
const out = [], L = s => out.push(s);
const chk = (nome, ok) => L(`- ${ok ? 'OK' : 'FALHA'}: ${nome}`);

L('### 6.2 Avaliação de uma solução');
let e = GA.evaluate(c('1100'), P, B);
L(`Entrada: 1100, orçamento ${R(B)}. Saída: custo ${R(e.custo)}; benefício ${e.beneficio}; saldo ${R(e.saldo)}; viável: ${e.viavel}; aptidão ${e.beneficio}.`);
const ref = { '0000': [0, 0], '1000': [4000, 7], '0100': [3000, 5], '0010': [2000, 3], '0001': [5000, 8],
  '1100': [7000, 12], '1010': [6000, 10], '0110': [5000, 8], '0011': [7000, 11] };
let viaveis = {};
for (let n = 0; n < 16; n++) { const s = n.toString(2).padStart(4, '0'), r = GA.evaluate(c(s), P, B); if (r.viavel) viaveis[s] = [r.custo / 100, r.beneficio]; }
chk('as 9 soluções viáveis e seus custos/benefícios coincidem com a referência', JSON.stringify(viaveis) === JSON.stringify(Object.fromEntries(Object.entries(ref).sort())));
chk('1100 tem custo R$ 7.000, benefício 12 e saldo 0', e.custo === 700000 && e.beneficio === 12 && e.saldo === 0);

L('\n### 6.3 Reparação');
const r3 = GA.repair(c('1111'), P, B);
L('Entrada: 1111, orçamento R$ 7.000. Passos: ' + r3.steps.map(x => `${x} (custo ${R(GA.evaluate(c(x), P, B).custo)}, benefício ${GA.evaluate(c(x), P, B).beneficio})`).join(' → '));
chk('1111 → 1101 → 1100 (remove C e depois D)', r3.steps.join() === '1111,1101,1100');

L('\n### 6.4 Cruzamento, mutação, reparação, seleção');
const [k1, k2] = GA.crossover(c('1100'), c('0011'), 2);
L(`Cruzamento 11|00 + 00|11: filho 1 = ${f(k1)}; filho 2 = ${f(k2)}`);
const m1 = GA.flip(k1, [1]);
L(`Mutação (só gene 1 do filho 1): filho 1 = ${f(m1)}; filho 2 = ${f(k2)}`);
const q1 = GA.repair(m1, P, B), q2 = GA.repair(k2, P, B);
L(`Reparação: filho 1: ${q1.steps.join(' → ')}; filho 2: ${q2.steps.join(' → ')}`);
const a1 = GA.evaluate(q1.c, P, B), a2 = GA.evaluate(q2.c, P, B);
L(`Avaliação: filho 1 = ${f(q1.c)}, custo ${R(a1.custo)}, aptidão ${a1.beneficio}; filho 2 = ${f(q2.c)}, custo ${R(a2.custo)}, aptidão ${a2.beneficio}`);
chk('saídas coincidem com a referência', f(k1) === '1111' && f(k2) === '0000' && f(m1) === '0111' && q1.steps.join() === '0111,0101,0100' && a1.custo === 300000 && a1.beneficio === 5 && f(q2.c) === '0000' && a2.beneficio === 0);
const rnd = GA.mulberry32(7);
chk('mutação 0%: nenhum gene invertido', GA.mutate(c('1010'), 0, rnd).pos.length === 0);
chk('mutação 100%: todos os genes invertidos', f(GA.mutate(c('1010'), 1, rnd).c) === '0101');
// cruzamento 0% e mutação 0%: filhos copiam os pais (nada novo na população)
let st = GA.create(P, B, { pop: 10, gens: 5, pc: 0, pm: 0, k: 2, elite: 0, seed: 3 });
const antes = new Set(st.pop.map(f)); GA.step(st);
chk('cruzamento 0% e mutação 0%: todos os filhos são cópias de pais da geração anterior', st.pop.every(x => antes.has(f(x))));
chk('torneio {1000:7, 0011:11, 1100:12} vence 1100', GA.winner([0, 1, 2], [7, 11, 12]) === 2);
chk('empate de aptidão: vence o menor índice na população', GA.winner([3, 1, 2], [5, 9, 9, 9]) === 1);
chk('torneio sorteia candidatos distintos e sempre devolve índice válido', (() => { const r = GA.mulberry32(1); for (let i = 0; i < 500; i++) { const w = GA.tournament([1, 2, 3, 4, 5], 5, r); if (w !== 4) return false; } return true; })());

L('\n### 6.5 Execução completa (população 20; 50 gerações; cruzamento 80%; mutação 5%; torneio 2; elite 1; semente 42)');
const run = (seed, pm, elite = 1) => { const s = GA.create(P, B, { pop: 20, gens: 50, pc: .8, pm, k: 2, elite, seed }); while (!s.done) GA.step(s); return s; };
const s42 = run(42, .05), ev = GA.evaluate(s42.best.c, P, B);
L(`Melhor solução: ${f(s42.best.c)} (geração ${s42.best.gen}); custo ${R(ev.custo)}; benefício ${ev.beneficio}; saldo ${R(ev.saldo)}.`);
chk('histórico com 51 registros', s42.hist.length === 51);
chk('melhor acumulado nunca diminui', s42.hist.every((h, i) => !i || h.acum >= s42.hist[i - 1].acum));
chk('com elitismo, melhor aptidão da população nunca diminui', s42.hist.every((h, i) => !i || h.melhor >= s42.hist[i - 1].melhor));
chk('custo ≤ R$ 7.000, benefício ≤ 12 e totais compatíveis com o cromossomo', ev.custo <= B && ev.beneficio <= 12 && ev.viavel);
L('\n**Efeito da mutação (sementes 1 a 5, demais parâmetros iguais):**\n\n| Mutação | Melhor benefício final (sementes 1,2,3,4,5) | Média | Execuções que atingiram 12 |\n|---|---|---|---|');
for (const pm of [.01, .2]) {
  const b = [1, 2, 3, 4, 5].map(sd => run(sd, pm).best.fit);
  L(`| ${pm * 100}% | ${b.join(', ')} | ${(b.reduce((x, y) => x + y) / 5).toFixed(1)} | ${b.filter(x => x === 12).length}/5 |`);
}

L('\n### 6.6 Limites de orçamento');
const s0 = GA.create(P, 0, { pop: 20, gens: 5, pc: .8, pm: .05, k: 2, elite: 1, seed: 1 });
chk('orçamento R$ 0: toda a população vira 0000', s0.pop.every(x => f(x) === '0000'));
e = GA.evaluate(c('1111'), P, 1400000);
L(`Orçamento R$ 14.000, cromossomo 1111: custo ${R(e.custo)}; benefício ${e.beneficio}; saldo ${R(e.saldo)}; viável ${e.viavel}.`);
chk('1111 viável com custo 14.000, benefício 23 e saldo 0', e.viavel && e.custo === 1400000 && e.beneficio === 23 && e.saldo === 0);
console.log(out.join('\n'));
