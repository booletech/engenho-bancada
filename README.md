# Engenho — Bancada de Engenharia · v2.1

[Plataforma](https://engenho-bancada.julio623.chatgpt.site) · [Materiais](https://engenho-bancada.julio623.chatgpt.site/#materials)

27 calculadoras em português para engenharia elétrica e eletrônica. Cálculos no navegador, sem cadastro ou envio dos valores.

## Ferramentas

Fundamentos: potência/corrente, Ohm, queda resistiva, energia/custo, fator de potência, divisor com carga, LED, RC, resistores e ADC ideal.

Avançadas de elétrica: queda AC R/X; falta trifásica em transformador; limite térmico I²t; RLC e ressonância; torque e escorregamento de motor; THD-I parcial. Aterramento: Wenner raso, alternativas de hastes/anel, coordenação TT/DR, GPR e dispersão 52/62/72%.

Avançadas de eletrônica: op amp e saturação; GBW/ganho de ruído/slew rate; buck/boost CCM; Sallen-Key com Q e ponto de −3 dB; rede térmica de dissipador.

Cada ferramenta possui fórmulas, memória, hipóteses, referência, explicação, exemplo resolvido e erro comum. Filtros por área/nível, cópia e relatório imprimível A4 (Salvar como PDF no navegador).

## Materiais

Doze guias originais em português, exercícios com resolução, trilhas de estudo, fontes dos autores, busca e glossário técnico. Sem reprodução de livros completos ou normas.

## Executar

Requer Node.js, sem dependências npm.

```sh
npm test
npm start
```

Abra http://127.0.0.1:4173. A pasta dist contém o site estático completo. 45 testes verificam valores conhecidos, balanços físicos, limites, entradas inválidas, avisos de hipótese e catálogo/material.

## Arquitetura

- dist/calculations.js: funções puras, validações e avisos.
- dist/tools.js: catálogo, unidades, exemplos e fontes.
- dist/learning.js: guias, explicações, exercícios e glossário.
- dist/app.js: interface, relatórios e WebMCP opcional.
- dist/styles.css: layout responsivo e impressão A4.
- tests/: modelos básicos e avançados.
- .github/workflows/checks.yml: testes automáticos no GitHub.
- .openai/hosting.json: identidade da hospedagem Sites.

## Limites

Modelos de apoio, sem certificação ou laudo. Seis algarismos significativos de apresentação não representam precisão metrológica. Avisos aparecem para CCM não atendido, saturação e excesso térmico.

Não implementa dimensionamento normativo completo, estudo IEC 60909 completo, seletividade, espectro harmônico completo, compensação/perdas de conversores ou modelo térmico transitório. THD é parcial (3ª/5ª/7ª). ADC usa piso e saturação. Confira hipóteses e datasheets.

## Privacidade e publicação

Dados de cálculo ficam em memória e se perdem ao recarregar. Sem analytics ou cookies de aplicação; a hospedagem pode registrar acessos. Google Fonts fornece fontes com fallback local.

Sites exige sincronizar o repositório de hospedagem e publicar uma versão empacotada. GitHub guarda código e documentação; push no GitHub não publica automaticamente no Sites. No Windows, o empacotador usa Bash do Git e TAR_OPTIONS=--force-local.

WebMCP é detectado por recurso; a interface continua funcionando nos navegadores sem suporte.

Aterramento: as verificações são parciais. Sem modelagem de malhas, solos em camadas, tensões de toque/passo, impulsos de raio ou certificação NBR 5410/NBR 5419/NBR 15751. GPR não é tensão de toque; relação TT e dispersão de ensaio não aprovam a instalação.
