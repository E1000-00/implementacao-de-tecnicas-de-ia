# Simulador de Algoritmo Genético: projetos de melhoria do campus

**Autores:** _[preencher: nomes e matrículas, até 3 estudantes]_
**Disciplina:** Inteligência Artificial, UFPI 2026.2
**Aplicação publicada:** _[colar o link do GitHub Pages]_

## Descrição
Simulador em HTML, CSS e JavaScript (sem servidor) que usa um algoritmo genético para escolher projetos com orçamento limitado, maximizando o benefício total.

- **Cromossomo binário**: um gene por projeto (1 = selecionado, 0 = excluído).
- **Aptidão**: benefício total da solução já reparada. A seleção vazia é válida (aptidão 0).
- **Operadores**: população inicial aleatória (cada gene 0/1 com probabilidade 0,5), torneio com candidatos distintos (empate: menor índice), cruzamento de um ponto (corte entre 1 e n−1, aplicado por par), mutação por inversão de bits (por gene) e elitismo.
- **Reparação**: enquanto o custo exceder o orçamento, remove o projeto selecionado de menor razão benefício/custo (empate: menor índice). Aplicada à população inicial e aos descendentes.
- **Geração**: copia os `elite` melhores sem modificação e completa com descendentes (pais sempre da população anterior). Se sobrar uma vaga, só o primeiro filho do último par é mantido. O tamanho da população é constante.
- Valores em reais são tratados em centavos (inteiros) internamente.
- A tela mostra geração atual, melhor aptidão da geração, média, melhor acumulado, melhor solução (cromossomo, projetos, custo, benefício, saldo), gráfico e tabela de histórico por geração e log textual de cada evento (pais, corte, filhos, bits mutados, reparações, elitismo). Há também uma **animação** passo a passo da reprodução (painel "Animação da reprodução"): destaca os pais escolhidos, mostra o ponto de corte, a troca de segmentos, os bits mutados (em vermelho) e cada projeto removido na reparação, além de elites preservados. Ela é montada a partir dos eventos reais registrados pelo algoritmo na última geração. Use **Avançar uma geração** (ou escolha outro evento e clique em *Reproduzir animação*); durante a execução contínua ela mostra apenas o resultado final de cada evento.

## Instruções de uso
1. Abra a página. Ela já carrega o exemplo da seção 6.1 e gera a geração 0.
2. Edite projetos (4 a 15) e parâmetros. Entradas inválidas exibem a mensagem de erro e bloqueiam os botões.
3. Qualquer alteração exige **Reiniciar**, que limpa o histórico e restabelece a semente.
4. **Executar** (retoma de onde parou), **Pausar** (preserva o estado), **Avançar uma geração** (gera exatamente uma e fica pausado).

## Parâmetros (valores iniciais)
Orçamento R$ 7.000 · População 20 (≥ 2) · Gerações 50 (≥ 1; a geração 0 é a inicial) · Cruzamento 80% (0–100, por par) · Mutação 5% (0–100, por gene) · Torneio 2 (2 a população) · Elite 1 (0 a população−1) · Semente 42 (inteiro).

## Bibliotecas
Nenhuma biblioteca externa. O gerador pseudoaleatório com semente (mulberry32), o algoritmo genético e o gráfico (canvas) foram implementados no próprio código.

## Arquivos
`index.html` (interface) · `ga.js` (algoritmo) · `test.js` (testes automatizados; `node test.js`).

## Resultados dos testes (seção 6)
Gerados por `node test.js`, com dados da seção 6.1 (A 4.000/7, B 3.000/5, C 2.000/3, D 5.000/8; orçamento R$ 7.000).

### 6.2 Avaliação de uma solução
Entrada: 1100, orçamento R$ 7.000. Saída: custo R$ 7.000; benefício 12; saldo R$ 0; viável: true; aptidão 12.
- OK: as 9 soluções viáveis e seus custos/benefícios coincidem com a referência
- OK: 1100 tem custo R$ 7.000, benefício 12 e saldo 0

### 6.3 Reparação
Entrada: 1111, orçamento R$ 7.000. Passos: 1111 (custo R$ 14.000, benefício 23) → 1101 (custo R$ 12.000, benefício 20) → 1100 (custo R$ 7.000, benefício 12)
- OK: 1111 → 1101 → 1100 (remove C e depois D)

### 6.4 Cruzamento, mutação, reparação, seleção
Cruzamento 11|00 + 00|11: filho 1 = 1111; filho 2 = 0000
Mutação (só gene 1 do filho 1): filho 1 = 0111; filho 2 = 0000
Reparação: filho 1: 0111 → 0101 → 0100; filho 2: 0000
Avaliação: filho 1 = 0100, custo R$ 3.000, aptidão 5; filho 2 = 0000, custo R$ 0, aptidão 0
- OK: saídas coincidem com a referência
- OK: mutação 0%: nenhum gene invertido
- OK: mutação 100%: todos os genes invertidos
- OK: cruzamento 0% e mutação 0%: todos os filhos são cópias de pais da geração anterior
- OK: torneio {1000:7, 0011:11, 1100:12} vence 1100
- OK: empate de aptidão: vence o menor índice na população
- OK: torneio sorteia candidatos distintos e sempre devolve índice válido

### 6.5 Execução completa (população 20; 50 gerações; cruzamento 80%; mutação 5%; torneio 2; elite 1; semente 42)
Melhor solução: 1100 (geração 0); custo R$ 7.000; benefício 12; saldo R$ 0.
- OK: histórico com 51 registros
- OK: melhor acumulado nunca diminui
- OK: com elitismo, melhor aptidão da população nunca diminui
- OK: custo ≤ R$ 7.000, benefício ≤ 12 e totais compatíveis com o cromossomo

**Efeito da mutação (sementes 1 a 5, demais parâmetros iguais):**

| Mutação | Melhor benefício final (sementes 1,2,3,4,5) | Média | Execuções que atingiram 12 |
|---|---|---|---|
| 1% | 12, 12, 12, 12, 12 | 12.0 | 5/5 |
| 20% | 12, 12, 12, 12, 12 | 12.0 | 5/5 |

### 6.6 Limites de orçamento
- OK: orçamento R$ 0: toda a população vira 0000
Orçamento R$ 14.000, cromossomo 1111: custo R$ 14.000; benefício 23; saldo R$ 0; viável true.
- OK: 1111 viável com custo 14.000, benefício 23 e saldo 0


### Conclusão
Todos os testes controlados coincidiram com os valores de referência. Na execução completa (semente 42) o ótimo 1100 (benefício 12) já aparece na população inicial, e o histórico tem 51 registros com melhor acumulado não decrescente. Na comparação de mutação, 1% e 20% atingiram 12 nas 5 sementes. Isso **não** indica que as taxas sejam equivalentes em geral: a instância tem só 16 combinações (9 viáveis) e a reparação leva 1100, 1101, 1110 e 1111 ao ótimo 1100, de modo que um sorteio aleatório já tem 25% de chance de resultar nele (cerca de 99,7% de aparecer ao menos uma vez em 20 indivíduos, logo na geração 0). A busca é fácil e a diferença entre taxas não aparece. Com instâncias maiores (até 15 projetos), taxas altas tendem a destruir boas soluções e taxas muito baixas reduzem a diversidade, mas isso deve ser verificado experimentalmente, não presumido.
