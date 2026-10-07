# Engenho — Bancada de Engenharia

Aplicação web em português para apoio a engenheiros eletricistas e eletrônicos. Os cálculos são realizados no navegador, sem cadastro ou envio dos valores a um servidor.

## Ferramentas da versão 1.0

Potência e corrente monofásica/trifásica, Lei de Ohm, queda de tensão resistiva, consumo/custo, compensação de fator de potência, divisor com carga, resistor para LEDs, circuito RC, associação de resistores e ADC ideal.

Cada ferramenta inclui validação de entrada, exemplo, unidades, fórmula, memória, hipóteses, referência, cópia e relatório imprimível (Salvar como PDF no navegador). Campos aceitam vírgula ou ponto decimal, sem separador de milhar. Resultados exibem até seis algarismos significativos; essa apresentação não representa precisão metrológica.

## Executar e verificar

Requer Node.js. Sem dependências npm.

```sh
npm test
npm start
```

Abra http://127.0.0.1:4173. A pasta `dist` contém o site completo e pode ser hospedada como conteúdo estático. Não exige backend, chave de API ou banco de dados.

## Arquitetura

- `dist/calculations.js`: funções matemáticas puras e validações.
- `dist/tools.js`: catálogo, unidades, exemplos e referências.
- `dist/app.js`: interface, relatórios e integração WebMCP opcional.
- `dist/styles.css`: interface responsiva e impressão A4.
- `tests/calculations.test.mjs`: resultados conhecidos, casos limite e entradas inválidas.
- `.openai/hosting.json`: identidade e configuração da hospedagem Sites.

## Limites técnicos

A queda de tensão considera FP=1, sem reatância, com resistividade fornecida. Não dimensiona ampacidade, proteção ou conformidade normativa. A compensação de FP considera regime senoidal sem harmônicas. O ADC usa quantização por piso e saturação na referência; consulte a função de transferência real do dispositivo. Os demais modelos e condições estão documentados em cada calculadora.

Dimensionamento normativo de cabos, proteção, curto-circuito, seletividade, harmônicas, tolerâncias e análise térmica completa não estão implementados. Nenhuma ferramenta emite laudo, certificação ou responsabilidade técnica.

## Privacidade

Os dados de cálculo ficam em memória na página e se perdem ao recarregar. Não há analytics, cookies de aplicação nem armazenamento de projetos. A hospedagem pode manter logs de acesso. Fontes visuais são carregadas do Google Fonts; há fontes locais de fallback. A cópia usa a área de transferência somente após clique. Referências externas abrem após ação do usuário.

## Atualizar

Edite o módulo correspondente, execute `npm test`, confira a interface e publique a pasta `dist`. Sites exige sincronizar o código no repositório de hospedagem antes de salvar e publicar uma versão. O GitHub guarda uma cópia versionada do projeto; atualizações no GitHub não disparam automaticamente a publicação Sites.

## Evolução priorizada

1. Revisão técnica independente e casos de referência adicionais.
2. Dimensionamento de condutores com requisitos normativos licenciados e fontes atualizadas.
3. Projeto salvo online, autenticação e relatórios identificados.
4. Filtros ativos, amplificadores, reguladores e dissipação térmica.
5. Pipeline contínuo de atualização e testes de interface.

WebMCP é opcional e detectado por recurso; os navegadores sem suporte continuam funcionando normalmente.
