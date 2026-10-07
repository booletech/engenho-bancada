// Pure engineering models. Inputs in units declared by the tool metadata.
export const VERSION = '1.0.0';
export function number(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value ?? '').trim();
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?$/i.test(raw)) throw Error('Informe um número válido. Use vírgula ou ponto decimal, sem separador de milhar.');
  const n = Number(raw.replace(',', '.'));
  if (!Number.isFinite(n)) throw Error('O valor deve ser finito.');
  return n;
}
const p = (x, label) => {const n=number(x); if(n<=0) throw Error(`${label} deve ser maior que zero.`); return n;};
const nn = (x,label) => {const n=number(x); if(n<0) throw Error(`${label} não pode ser negativo.`);return n;};
const factor = (x,label) => {const n=p(x,label);if(n>1) throw Error(`${label} deve estar entre 0 e 1, excluindo zero.`);return n;};
const row = (label,value,unit='') => ({label,value,unit});
function mode(x,allowed){if(!allowed.includes(x))throw Error('Seleção inválida.');return x;}
export function calculate(id, x) {
  let values, formula, steps, note;
  switch(id) {
    case 'ohm': {
      const v=nn(x.v,'Tensão'),r=p(x.r,'Resistência'),i=v/r;
      values=[row('Corrente',i,'A'),row('Potência dissipada',v*i,'W')];formula='I = V / R; P = V² / R';steps=[`I = ${v} / ${r}`,`P = ${v}² / ${r}`];note='Carga puramente resistiva em corrente contínua. Não considera variação de resistência com temperatura.';break;
    }
    case 'power': {
      const power=nn(x.p,'Potência útil')*1000,v=p(x.v,'Tensão'),fp=factor(x.fp,'Fator de potência'),eta=factor(x.eta,'Rendimento');
      const system=mode(x.system,['mono','tri']),k=system==='tri'?Math.sqrt(3):1,active=power/eta,s=active/fp;
      values=[row('Corrente de linha',s/(k*v),'A'),row('Potência ativa de entrada',active/1000,'kW'),row('Potência aparente',s/1000,'kVA'),row('Potência reativa',Math.sqrt(Math.max(0,s*s-active*active))/1000,'kvar')];
      formula=system==='tri'?'I = Pútil / (√3 × Vlinha × FP × η)':'I = Pútil / (V × FP × η)';steps=[`Pentrada = ${power} / ${eta} W`,`S = ${active} / ${fp} VA`,`I = ${s} / (${k} × ${v}) A`];note='Valores eficazes, regime senoidal e carga indutiva. No trifásico, carga equilibrada e tensão entre fases. Use rendimento 1 quando a potência informada já for a de entrada.';break;
    }
    case 'drop': {
      const v=p(x.v,'Tensão'),l=nn(x.l,'Comprimento'),i=nn(x.i,'Corrente'),a=p(x.a,'Seção'),rho=p(x.rho,'Resistividade'),k=mode(x.system,['mono','tri'])==='tri'?Math.sqrt(3):2,d=k*rho*l*i/a;
      values=[row('Queda de tensão',d,'V'),row('Queda relativa',100*d/v,'%'),row('Tensão estimada na carga',v-d,'V')];formula='ΔV = k × ρ × L × I / A; ΔV% = 100 × ΔV / V';steps=[`k = ${k}; L é o comprimento de ida`,`ΔV = ${k} × ${rho} × ${l} × ${i} / ${a}`];note='Estimativa resistiva: FP = 1, sem reatância e sem correção de temperatura. No trifásico, circuito equilibrado. Não dimensiona ampacidade nem proteção e não verifica conformidade normativa. Resistividade deve corresponder à temperatura de operação.';if(d>=v)note+=' ATENÇÃO: a queda calculada é igual ou superior à tensão de alimentação; reveja os dados e o modelo.';break;
    }
    case 'energy': {
      const power=nn(x.p,'Potência'),h=nn(x.h,'Horas por dia'),days=number(x.d),tariff=nn(x.tariff,'Tarifa');if(h>24)throw Error('Horas por dia não pode ultrapassar 24.');if(!Number.isInteger(days)||days<1||days>366)throw Error('Use um período inteiro de 1 a 366 dias.');const e=power*h*days/1000;
      values=[row('Consumo no período',e,'kWh'),row('Custo estimado',e*tariff,'R$')];formula='E = P(W) × h/dia × dias / 1000; custo = E × tarifa';steps=[`E = ${power} × ${h} × ${days} / 1000`,`Custo = ${e} × ${tariff}`];note='Potência constante durante o uso. Tarifa fornecida pelo usuário; tributos, bandeiras, demanda e cobranças fixas só entram se incluídos por você.';break;
    }
    case 'pf': {
      const power=nn(x.p,'Potência ativa'),a=factor(x.initial,'FP inicial'),b=factor(x.target,'FP desejado');if(b<a)throw Error('O FP desejado deve ser maior ou igual ao inicial.');const q=power*(Math.tan(Math.acos(a))-Math.tan(Math.acos(b)));
      values=[row('Compensação reativa',q,'kvar'),row('Potência aparente inicial',power/a,'kVA'),row('Potência aparente desejada',power/b,'kVA')];formula='Qc = P × [tan(arccos(FP₁)) − tan(arccos(FP₂))]';steps=[`Qc = ${power} × [tan(arccos(${a})) − tan(arccos(${b}))]`];note='Carga indutiva senoidal, sem harmônicas. Estima a potência reativa; seleção do banco exige avaliar tensão, frequência, ressonância, etapas e risco de sobrecompensação.';break;
    }
    case 'divider': {
      const v=nn(x.v,'Tensão'),a=p(x.r1,'R1'),b=p(x.r2,'R2'),loaded=String(x.rl??'').trim()!=='';const load=loaded?p(x.rl,'Resistência da carga'):Infinity,eq=loaded?b*load/(b+load):b,out=v*eq/(a+eq),ideal=v*b/(a+b);
      values=[row('Tensão de saída',out,'V'),row('Saída sem carga',ideal,'V'),row('Corrente em R1',v/(a+eq)*1000,'mA'),row('Dissipação em R1',(v-out)**2/a,'W'),row('Dissipação em R2',out*out/b,'W')];formula='R₂eq = R₂ ∥ Rcarga; Vout = Vin × R₂eq / (R₁ + R₂eq)';steps=[`R₂eq = ${eq} Ω`,`Vout = ${v} × ${eq} / (${a} + ${eq})`];note='Resistores ideais em corrente contínua. Carga em paralelo com R2; deixe o campo da carga vazio para circuito aberto. Não considera tolerâncias ou impedância dinâmica de ADCs.';break;
    }
    case 'led': {
      const v=p(x.v,'Alimentação'),vf=p(x.vf,'Queda do LED'),i=p(x.i,'Corrente')/1000,count=number(x.n);if(!Number.isInteger(count)||count<1||count>1000)throw Error('Quantidade deve ser um inteiro de 1 a 1000.');if(v<=vf*count)throw Error('Alimentação deve ser maior que a soma das quedas dos LEDs.');const d=v-vf*count,r=d/i;values=[row('Resistência calculada',r,'Ω'),row('Potência no resistor',d*i,'W'),row('Tensão no resistor',d,'V')];formula='R = (Vfonte − n × Vf) / I; PR = I² × R';steps=[`R = (${v} − ${count} × ${vf}) / ${i}`,`PR = ${i}² × ${r}`];note='LEDs em série, corrente contínua e Vf constante. Use o datasheet para tolerância de Vf e corrente admissível. Selecione resistor comercial e potência nominal com margem térmica; o valor calculado não inclui essa margem.';break;
    }
    case 'rc': {
      const r=p(x.r,'Resistência'),c=p(x.c,'Capacitância')*1e-6,v=nn(x.v,'Tensão final'),t=nn(x.t,'Tempo')/1000,tau=r*c;
      values=[row('Constante de tempo',tau*1000,'ms'),row('Frequência de corte',1/(2*Math.PI*tau),'Hz'),row('Tensão no capacitor',v*(-Math.expm1(-t/tau)),'V'),row('Tempo para 99,3%',5*tau*1000,'ms')];formula='τ = R × C; fc = 1 / (2πRC); Vc(t) = V × (1 − e⁻ᵗ/τ)';steps=[`C = ${c} F; t = ${t} s`,`τ = ${r} × ${c}`,`Vc = ${v} × (1 − exp(−${t}/${tau}))`];note='Carga de capacitor inicialmente descarregado por degrau ideal; circuito RC de primeira ordem. Frequência de corte para filtro passa-baixas com saída no capacitor, sem carga.';break;
    }
    case 'resistors': {
      const a=p(x.r1,'R1'),b=p(x.r2,'R2'),c=p(x.r3,'R3');values=[row('Equivalente em série',a+b+c,'Ω'),row('Equivalente em paralelo',1/(1/a+1/b+1/c),'Ω')];formula='Rs = R₁ + R₂ + R₃; Rp = 1 / (1/R₁ + 1/R₂ + 1/R₃)';steps=[`Rs = ${a} + ${b} + ${c}`,`Rp = 1 / (1/${a} + 1/${b} + 1/${c})`];note='Três resistores ideais; tolerância, aquecimento e potência admissível não são considerados.';break;
    }
    case 'adc': {
      const v=nn(x.v,'Entrada'),ref=p(x.ref,'Referência'),bits=number(x.bits);if(!Number.isInteger(bits)||bits<1||bits>24)throw Error('Resolução deve ser um inteiro de 1 a 24 bits.');if(v>ref)throw Error('Entrada deve estar entre 0 e a referência.');const levels=2**bits,code=Math.min(levels-1,Math.floor(v/ref*levels));values=[row('Código digital',code,''),row('Tamanho de 1 LSB',ref/levels*1000,'mV'),row('Limite inferior do código',code*ref/levels,'V'),row('Código máximo',levels-1,'')];formula='LSB = Vref / 2ᴺ; código = min(2ᴺ − 1, floor(Vin / LSB))';steps=[`Níveis = 2^${bits} = ${levels}`,`LSB = ${ref} / ${levels}`,`Código = min(${levels-1}, floor(${v} / ${ref/levels}))`];note='ADC ideal unipolar com quantização por piso e saturação na referência. A função de transferência real pode usar outra convenção; consulte o datasheet. Não modela offset, ganho, ruído ou não linearidade.';break;
    }
    default: throw Error('Ferramenta não encontrada.');
  }
  if(values.some(r=>!Number.isFinite(r.value)))throw Error('Os valores excedem o intervalo numérico do cálculo. Reduza as grandezas.');
  return {id,values,formula,steps,note,version:VERSION};
}
