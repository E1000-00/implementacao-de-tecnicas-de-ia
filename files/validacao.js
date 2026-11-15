// validacao.js — confere o formulário e devolve mensagens claras ou a configuração pronta.
// Entrada: textos digitados pelo usuário. Saída: { erros: [...], config: {...} }.

// Converte texto em número dentro dos limites; se algo estiver errado, registra o erro e devolve null.
function lerNumero(texto, rotulo, { min, max, inteiro = false }, erros) {
  if (texto === undefined || String(texto).trim() === '') {
    erros.push(`${rotulo}: campo vazio.`);
    return null;
  }
  const valor = Number(String(texto).trim().replace(',', '.'));
  if (!Number.isFinite(valor)) {
    erros.push(`${rotulo}: "${texto}" não é um número válido.`);
  } else if (inteiro && !Number.isInteger(valor)) {
    erros.push(`${rotulo}: deve ser um número inteiro.`);
  } else if (valor < min || valor > max) {
    erros.push(`${rotulo}: deve estar entre ${min} e ${max}.`);
  } else {
    return valor;
  }
  return null;
}

function lerCoordenada(texto, rotulo, erros) {
  const valor = lerNumero(texto, rotulo, { min: 0, max: 1000 }, erros);
  if (valor !== null && Math.abs(valor * 100 - Math.round(valor * 100)) > 1e-6) {
    erros.push(`${rotulo}: use no máximo duas casas decimais.`);
    return null;
  }
  return valor;
}

function validarVertices(lista, erros) {
  if (lista.length < 4 || lista.length > 12) {
    erros.push(`Vértices: são necessários de 4 a 12 (há ${lista.length}).`);
  }
  const ids = new Set();
  const coordenadas = new Set();
  return lista.map((v, k) => {
    const rotulo = `Vértice ${k + 1}`;
    if (!/^[A-Za-z0-9_-]{1,8}$/.test(v.id)) {
      erros.push(`${rotulo}: identificador vazio ou inválido (use 1 a 8 letras, números, _ ou -).`);
    } else if (ids.has(v.id)) {
      erros.push(`${rotulo}: identificador "${v.id}" repetido.`);
    }
    ids.add(v.id);
    const x = lerCoordenada(v.x, `${rotulo} (x)`, erros);
    const y = lerCoordenada(v.y, `${rotulo} (y)`, erros);
    if (x !== null && y !== null) {
      if (coordenadas.has(`${x},${y}`)) erros.push(`${rotulo}: coordenadas (${x}, ${y}) repetidas.`);
      coordenadas.add(`${x},${y}`);
    }
    return { id: v.id, x, y };
  });
}

function validar(entrada) {
  const erros = [];
  const vertices = validarVertices(entrada.vertices, erros);
  const deposito = vertices.findIndex(v => v.id === entrada.deposito);
  if (deposito < 0) erros.push('Depósito: selecione um dos vértices cadastrados.');

  const ler = (campo, rotulo, limites) => lerNumero(entrada[campo], rotulo, limites, erros);
  const rhoPercentual = ler('rho', 'Taxa de evaporação (ρ, %)', { min: 0, max: 90 });
  const config = {
    vertices, deposito,
    formigas: ler('formigas', 'Número de formigas', { min: 1, max: 100, inteiro: true }),
    iteracoes: ler('iteracoes', 'Número de iterações', { min: 1, max: 200, inteiro: true }),
    alfa: ler('alfa', 'Influência do feromônio (α)', { min: 0, max: 5 }),
    beta: ler('beta', 'Influência da distância (β)', { min: 0, max: 5 }),
    rho: rhoPercentual === null ? null : rhoPercentual / 100, // 50% vira 0,5
    tau0: ler('tau0', 'Feromônio inicial (τ₀)', { min: 0.01, max: 100 }),
    Q: ler('Q', 'Constante de depósito (Q)', { min: 0.01, max: 10000 }),
    semente: ler('semente', 'Semente aleatória', { min: -2147483648, max: 2147483647, inteiro: true }),
  };
  return { erros, config };
}

if (typeof module !== 'undefined') module.exports = { validar }; // uso nos testes (Node)
