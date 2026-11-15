/* Motor do algoritmo genético (mochila / projetos do campus). Sem bibliotecas.
   Valores monetários são tratados em centavos (inteiros) para evitar erros de ponto flutuante. */
const GA = (() => {
  const fmt = c => c.join('');
  const proj = (nome, reais, beneficio) => ({ nome, custo: Math.round(reais * 100), beneficio });

  // PRNG com semente (mulberry32)
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function evaluate(c, P, B) {
    let custo = 0, beneficio = 0;
    c.forEach((x, i) => { if (x) { custo += P[i].custo; beneficio += P[i].beneficio; } });
    return { custo, beneficio, saldo: B - custo, viavel: custo <= B };
  }

  // Reparação: remove o selecionado de menor benefício/custo (empate: menor índice)
  function repair(c, P, B) {
    c = c.slice();
    const steps = [fmt(c)];
    while (evaluate(c, P, B).custo > B) {
      let w = -1;
      for (let i = 0; i < c.length; i++)
        if (c[i] && (w < 0 || P[i].beneficio * P[w].custo < P[w].beneficio * P[i].custo)) w = i;
      c[w] = 0;
      steps.push(fmt(c));
    }
    return { c, steps };
  }

  // Vencedor entre candidatos: maior aptidão; empate -> menor índice na população
  function winner(cands, fit) {
    let w = cands[0];
    for (const x of cands.slice(1)) if (fit[x] > fit[w] || (fit[x] === fit[w] && x < w)) w = x;
    return w;
  }

  // Torneio com k candidatos distintos
  function tournament(fit, k, rnd) {
    const idx = fit.map((_, i) => i);
    for (let i = 0; i < k; i++) {
      const j = i + Math.floor(rnd() * (idx.length - i));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return winner(idx.slice(0, k), fit);
  }

  // Cruzamento de um ponto: corte após o gene `cut` (1..n-1)
  const crossover = (p1, p2, cut) =>
    [p1.slice(0, cut).concat(p2.slice(cut)), p2.slice(0, cut).concat(p1.slice(cut))];

  // Inverte os genes indicados (posições 1-based)
  const flip = (c, pos) => c.map((g, i) => (pos.includes(i + 1) ? 1 - g : g));

  // Mutação independente por gene
  function mutate(c, rate, rnd) {
    const pos = [];
    c.forEach((_, i) => { if (rnd() < rate) pos.push(i + 1); });
    return { c: flip(c, pos), pos };
  }

  function record(s) {
    s.fit = s.pop.map(c => evaluate(c, s.P, s.B).beneficio);
    let bi = 0;
    s.fit.forEach((f, i) => { if (f > s.fit[bi]) bi = i; });
    if (!s.best || s.fit[bi] > s.best.fit) s.best = { c: s.pop[bi].slice(), fit: s.fit[bi], gen: s.gen };
    const media = s.fit.reduce((a, b) => a + b, 0) / s.fit.length;
    s.hist.push({ gen: s.gen, melhor: s.fit[bi], media, acum: s.best.fit });
  }

  // cfg: { pop, gens, pc, pm, k, elite, seed }  (pc e pm em fração 0..1)
  function create(P, B, cfg) {
    const rnd = mulberry32(cfg.seed), n = P.length;
    const s = { P, B, cfg, rnd, gen: 0, pop: [], fit: [], hist: [], log: [], events: [], best: null, done: false };
    for (let i = 0; i < cfg.pop; i++) {
      const c = Array.from({ length: n }, () => (rnd() < 0.5 ? 1 : 0));
      const r = repair(c, P, B);
      s.log.push(`G0 · indivíduo #${i}: ${r.steps.length > 1 ? 'reparação ' + r.steps.join(' → ') : fmt(r.c)}`);
      s.pop.push(r.c);
    }
    record(s);
    s.done = cfg.gens < 1;
    return s;
  }

  // Produz exatamente uma nova geração
  function step(s) {
    if (s.done) return;
    const { cfg, P, B, rnd } = s, N = cfg.pop, prev = s.pop, fit = s.fit, g = s.gen + 1;
    const add = t => s.log.push(`G${g} · ${t}`);
    const order = fit.map((_, i) => i).sort((a, b) => fit[b] - fit[a] || a - b);
    const next = [], evs = [];
    for (let i = 0; i < cfg.elite; i++) {
      next.push(prev[order[i]].slice());
      evs.push({ type: 'elite', c: prev[order[i]].slice(), fit: fit[order[i]] });
      add(`elitismo: ${fmt(prev[order[i]])} (aptidão ${fit[order[i]]}) preservado`);
    }
    while (next.length < N) {
      const a = tournament(fit, cfg.k, rnd), b = tournament(fit, cfg.k, rnd);
      const p1 = prev[a], p2 = prev[b];
      let k1 = p1.slice(), k2 = p2.slice(), cut = 0;
      let t = `pais: ${fmt(p1)} (#${a}) e ${fmt(p2)} (#${b}); `;
      if (rnd() < cfg.pc) {
        cut = 1 + Math.floor(rnd() * (P.length - 1));
        [k1, k2] = crossover(p1, p2, cut);
        t += `corte após o gene ${cut}; filhos: ${fmt(k1)} e ${fmt(k2)}; `;
      } else t += `sem cruzamento, filhos copiam os pais: ${fmt(k1)} e ${fmt(k2)}; `;
      const x1 = k1.slice(), x2 = k2.slice();
      const m1 = mutate(k1, cfg.pm, rnd), m2 = mutate(k2, cfg.pm, rnd);
      t += m1.pos.length ? `mutação no(s) gene(s) ${m1.pos.join(',')} do filho 1: ${fmt(m1.c)}; ` : 'sem mutação no filho 1; ';
      t += m2.pos.length ? `mutação no(s) gene(s) ${m2.pos.join(',')} do filho 2: ${fmt(m2.c)}; ` : 'sem mutação no filho 2; ';
      const r1 = repair(m1.c, P, B), r2 = repair(m2.c, P, B);
      t += r1.steps.length > 1 ? `reparação do filho 1: ${r1.steps.join(' → ')}; ` : 'filho 1 viável; ';
      t += r2.steps.length > 1 ? `reparação do filho 2: ${r2.steps.join(' → ')}` : 'filho 2 viável';
      next.push(r1.c);
      const drop = next.length >= N;
      if (!drop) next.push(r2.c); else t += ' (filho 2 descartado: restava uma vaga)';
      evs.push({ type: 'pair', a, b, p1: p1.slice(), p2: p2.slice(), cut, x1, x2, mu1: m1.c, mu2: m2.c,
        pos1: m1.pos, pos2: m2.pos, s1: r1.steps, s2: r2.steps, drop });
      add(t);
    }
    s.pop = next;
    s.events = evs;
    s.gen = g;
    record(s);
    if (s.gen >= cfg.gens) s.done = true;
  }

  return { fmt, proj, mulberry32, evaluate, repair, winner, tournament, crossover, flip, mutate, create, step };
})();
if (typeof module !== 'undefined') module.exports = GA;
