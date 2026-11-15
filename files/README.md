# Colônia de Formigas — Rota de Entregas

**Autores:** _(preencher: nome e matrícula de cada integrante)_
**Aplicação publicada:** _(colar o link do GitHub Pages)_

## Descrição da solução

Simulador do **Ant System** que busca a menor rota de entregas: o veículo sai do depósito, visita cada ponto
uma vez e volta. Os locais formam um grafo completo, não direcionado, com distância euclidiana.
Tudo roda no navegador (HTML, CSS e JavaScript puros), sem servidor.

| Arquivo | Conteúdo |
|---|---|
| `aco.js` | Algoritmo: gerador com semente, distâncias, probabilidades, construção de rotas, evaporação e depósito |
| `validacao.js` | Validação do formulário, com mensagens claras |
| `app.js` | Tela: formulário, botões, grafo em SVG, métricas, histórico e logs |
| `testes.js` | Testes 6.1 a 6.5 (`node testes.js`) |

## Como usar

1. Edite os vértices (id, x, y), escolha o depósito e ajuste os parâmetros.
2. **Executar** roda as iterações até o fim; **Pausar** mantém o estado; **Avançar uma iteração** executa uma e fica pausado; **Reiniciar** limpa o histórico, restaura τ₀ e a semente.
3. Alterar qualquer dado ou parâmetro exige **Reiniciar**. Campos vazios ou inválidos bloqueiam a execução.
4. Passe o cursor sobre uma aresta para ver distância e feromônio. Clique em uma linha do histórico para ver o log da iteração (probabilidades, escolhas, retorno ao depósito e feromônio anterior → após evaporação → depósito → final por aresta).
5. O botão **Carregar teste 6.4** carrega A, B, C, D e os parâmetros da seção 6.4.

## Parâmetros

| Campo | Faixa | Padrão |
|---|---|---|
| Vértices (x, y com até 2 casas) | 4 a 12; coordenadas de 0 a 1000 | 7 vértices |
| Formigas | 1 a 100 | 10 |
| Iterações | 1 a 200 | 30 |
| α (feromônio) | 0 a 5 | 1 |
| β (distância) | 0 a 5 | 2 |
| ρ (evaporação, %) | 0 a 90 | 50 |
| τ₀ | 0,01 a 100 | 1 |
| Q | 0,01 a 10000 | 2500 (cenário padrão) |
| Semente | inteiro | 42 |

Na tela, a espessura da linha cinza mostra o feromônio **relativo ao maior valor atual**; a legenda informa esse maior valor, que muda a cada iteração.

## Bibliotecas auxiliares

Nenhuma. O gerador pseudoaleatório (mulberry32), o grafo (SVG) e a interface foram escritos à mão.

## Resultados dos testes

Saída de `node testes.js` (todos passaram; tolerância de 0,000001).

- **6.1** Instância A(0,0), B(3,0), C(3,4), D(0,4). Comprimentos obtidos: ABCDA = 14, ABDCA = 16, ACBDA = 18, ACDBA = 16, ADBCA = 18, ADCBA = 14. Distâncias simétricas e d(i,i) = 0. **Conclusão:** cálculo correto.
- **6.2** Com τ = 1, α = 1, β = 2: w(A,B), w(A,C), w(A,D) = 1/9, 1/25, 1/16; p = 0,520156 / 0,187256 / 0,292588 (soma 1). Após B: p(B,C) = 0,609756 e p(B,D) = 0,390244. Com α = 0 e β = 0 as probabilidades ficam iguais (1/3); com um só candidato p = 1. **Conclusão:** correto.
- **6.3** τ₀ = 1, ρ = 50%, Q = 14, uma formiga, rota ABCDA forçada. AB: anterior 1; após evaporação 0,5; depósito 1; final 1,5. AC: anterior 1; após evaporação 0,5; depósito 0; final 0,5. Iteração 1: perímetro 1,5 e diagonais 0,5. Iteração 2: perímetro 1,75 e diagonais 0,25. Com duas formigas: perímetro 2,5 e diagonais 0,5. Diagonal da matriz sem feromônio. **Conclusão:** evaporação e soma dos depósitos corretas.
- **6.4** 10 formigas, 30 iterações, α = 1, β = 2, ρ = 50%, τ₀ = 1, Q = 14, semente 42. Melhor rota **A → B → C → D → A, comprimento 14**. Foram gerados 30 registros, a melhor distância acumulada nunca aumentou e repetir a execução reproduziu o mesmo histórico. No estado inicial (iteração 0) a melhor distância aparece como "ainda não calculada".
- **6.5** Sementes 1 a 5, demais parâmetros da 6.4:

  | Configuração | Melhores finais | Média | Atingiram 14 |
  |---|---|---|---|
  | β = 0 | 14, 14, 14, 14, 14 | 14 | 5 de 5 |
  | β = 2 | 14, 14, 14, 14, 14 | 14 | 5 de 5 |

  **Interpretação:** não houve diferença. A instância tem só 6 rotas (duas ótimas) e 10 formigas por 30 iterações, então mesmo o sorteio uniforme (β = 0) acaba encontrando o ótimo. A diferença de β tende a aparecer em instâncias maiores.

  **Entradas inválidas bloqueadas** (mensagens obtidas): "Vértice 2: coordenadas (0, 0) repetidas."; "Vértice 2: identificador "A" repetido."; "Vértices: são necessários de 4 a 12 (há 3)."; "Número de formigas: campo vazio."; "Influência do feromônio (α): deve estar entre 0 e 5."; "Taxa de evaporação (ρ, %): deve estar entre 0 e 90."; "Vértice 1 (x): use no máximo duas casas decimais."; "Vértice 1 (y): deve estar entre 0 e 1000."
  Com ρ = 0% a evaporação não reduz o feromônio (apenas os depósitos o alteram).

## Publicação

No repositório público: **Settings → Pages → Deploy from a branch → main / (root)**. Troque o link `SEU-USUARIO/SEU-REPOSITORIO` no `index.html` pelo endereço real do repositório.
