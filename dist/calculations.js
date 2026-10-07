// Pure engineering models. Inputs in units declared by the tool metadata.
export const VERSION = '2.0.0';
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
  const warnings=[];
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
    case 'drop-ac': {
      const v=p(x.v,'Tensão'),l=nn(x.l,'Comprimento')/1000,i=nn(x.i,'Corrente'),r=nn(x.r,'Resistência por km'),react=nn(x.x,'Reatância por km'),fp=factor(x.fp,'Fator de potência'),sign=mode(x.load,['lag','lead'])==='lag'?1:-1,k=mode(x.system,['mono','tri'])==='tri'?Math.sqrt(3):2;
      const sin=Math.sqrt(Math.max(0,1-fp*fp)),d=k*l*i*(r*fp+sign*react*sin);
      values=[row('Variação longitudinal',d,'V'),row('Variação relativa',100*d/v,'%'),row('Tensão aproximada na carga',v-d,'V')];formula='ΔV ≈ k × L(km) × I × [R × cosφ ± X × senφ]';steps=[`senφ = √(1 − ${fp}²) = ${sin}`,`ΔV = ${k} × ${l} × ${i} × (${r} × ${fp} ${sign===1?'+':'−'} ${react} × ${sin})`];note='Aproximação longitudinal em regime senoidal; sinal + para carga indutiva e − para capacitiva. R e X por condutor e na temperatura/frequência de operação. L de ida. Não calcula o módulo fasorial exato, ampacidade ou conformidade. ΔV negativo indica elevação de tensão neste modelo.';if(Math.abs(d)/v>.1)note+=' Variação acima de 10%: a aproximação merece conferência por análise fasorial.';break;
    }
    case 'short-transformer': {
      const s=p(x.s,'Potência nominal')*1000,v=p(x.v,'Tensão entre fases'),z=p(x.z,'Impedância percentual');if(z>100)throw Error('Impedância percentual deve ser menor ou igual a 100.');const rated=s/(Math.sqrt(3)*v),isc=rated*100/z;
      values=[row('Curto-circuito trifásico estimado',isc/1000,'kA'),row('Corrente nominal',rated,'A'),row('Impedância equivalente por fase',v*v/s*z/100,'Ω')];formula='In = Sn / (√3 × VLL); Icc ≈ In × 100 / Z%';steps=[`In = ${s} / (√3 × ${v})`,`Icc = ${rated} × 100 / ${z}`];note='Falta trifásica franca nos terminais de um único transformador, tensão nominal e rede a montante com impedância desprezada. Não inclui motores, cabos, tolerâncias, fatores de tensão ou pico assimétrico. Não constitui estudo completo conforme IEC 60909 nem seleciona poder de interrupção.';break;
    }
    case 'adiabatic': {
      const i=p(x.i,'Corrente de falta')*1000,t=p(x.t,'Tempo'),k=p(x.k,'Coeficiente k'),s=p(x.s,'Seção existente');if(t>5)throw Error('Este modelo adiabático está limitado a tempos de até 5 s.');const req=i*Math.sqrt(t)/k,energy=i*i*t,limit=(k*s)**2,ratio=energy/limit;
      values=[row('Seção térmica calculada',req,'mm²'),row('Energia específica I²t',energy,'A²·s'),row('Limite térmico (kS)²',limit,'A²·s'),row('Utilização térmica',ratio*100,'%')];formula='Smin = I × √t / k; I²t ≤ (k × S)²';steps=[`Smin = ${i} × √${t} / ${k}`,`I²t = ${i}² × ${t}; (kS)² = (${k} × ${s})²`];note=`Verificação exclusivamente térmica adiabática. ${ratio<=1?'O critério térmico informado é atendido pelo modelo.':'O critério térmico informado não é atendido.'} k depende do material, isolação e temperaturas inicial/final; confirme a fonte. Para proteção limitadora, use a energia passante I²t do fabricante; não substitua por corrente presumida vezes tempo. Não verifica ampacidade, seção normativa mínima ou esforços mecânicos.`;break;
    }
    case 'rlc': {
      const r=p(x.r,'Resistência'),l=p(x.l,'Indutância')*1e-3,c=p(x.c,'Capacitância')*1e-6,freq=p(x.f,'Frequência'),v=nn(x.v,'Tensão RMS'),w=2*Math.PI*freq,xl=w*l,xc=1/(w*c),react=xl-xc,z=Math.hypot(r,react),i=v/z;
      values=[row('Módulo da impedância',z,'Ω'),row('Corrente RMS',i,'A'),row('Ângulo de Z',Math.atan2(react,r)*180/Math.PI,'°'),row('Frequência de ressonância',1/(2*Math.PI*Math.sqrt(l*c)),'Hz'),row('Fator de qualidade Q',Math.sqrt(l/c)/r,''),row('Potência ativa',i*i*r,'W'),row('Reatância líquida',react,'Ω')];formula='Z = R + j(ωL − 1/ωC); |Z| = √[R² + (XL − XC)²]; f₀ = 1/(2π√LC)';steps=[`XL = ${xl} Ω; XC = ${xc} Ω`,`|Z| = hypot(${r}, ${react}); I = ${v} / ${z}`];note='R, L e C em série, componentes ideais e fonte senoidal. Ângulo positivo indica comportamento indutivo; negativo, capacitivo. Não inclui ESR, perdas do núcleo ou parasitas. R deve incluir as perdas série relevantes; tensões individuais podem exceder a alimentação perto da ressonância.';break;
    }
    case 'motor': {
      const freq=p(x.f,'Frequência'),poles=number(x.poles),speed=p(x.n,'Velocidade do eixo'),power=nn(x.p,'Potência mecânica')*1000;if(!Number.isInteger(poles)||poles<2||poles>64||poles%2)throw Error('Polos deve ser um número par inteiro de 2 a 64.');const sync=120*freq/poles;if(speed>sync)throw Error('Este módulo considera operação motora: velocidade não pode superar a síncrona.');const slip=(sync-speed)/sync,torque=power/(2*Math.PI*speed/60);
      values=[row('Torque no eixo',torque,'N·m'),row('Velocidade síncrona',sync,'rpm'),row('Escorregamento',slip*100,'%'),row('Frequência elétrica do rotor',slip*freq,'Hz')];formula='ns = 120 × f / polos; s = (ns − n)/ns; T = Pmecânica / (2πn/60)';steps=[`ns = 120 × ${freq} / ${poles}`,`s = (${sync} − ${speed}) / ${sync}`,`T = ${power} / (2π × ${speed} / 60)`];note='Motor de indução em regime motor, rotação positiva e potência mecânica no eixo. Não calcula torque de partida, curva torque × velocidade, perdas ou corrente de partida. Escorregamento zero é um limite ideal do modelo; não corresponde a torque sustentado de um motor de indução real.';break;
    }
    case 'thd': {
      const base=p(x.i1,'Corrente fundamental'),h3=nn(x.i3,'3ª harmônica'),h5=nn(x.i5,'5ª harmônica'),h7=nn(x.i7,'7ª harmônica'),df=factor(x.cos,'Fator de deslocamento'),h=Math.hypot(h3,h5,h7),rms=Math.hypot(base,h),thd=h/base;
      values=[row('THD-I parcial (referência fundamental)',100*thd,'%'),row('Corrente RMS parcial',rms,'A'),row('FP estimado com tensão senoidal',df/Math.sqrt(1+thd*thd),''),row('Corrente harmônica RMS parcial',h,'A')];formula='THD-I = √(I₃² + I₅² + I₇²)/I₁; Irms = √(I₁² + ΣIh²); FP ≈ cosφ₁/√(1+THD²)';steps=[`Ih = hypot(${h3}, ${h5}, ${h7})`,`THD-I = ${h} / ${base}; Irms = hypot(${base}, ${h})`];note='Somente fundamental, 3ª, 5ª e 7ª harmônicas, valores RMS, sem componente DC. É um indicador parcial: harmônicas não informadas são omitidas. FP estimado supõe tensão puramente senoidal. Não calcula TDD, correntes de neutro ou conformidade com limites de qualidade de energia.';break;
    }
    case 'opamp': {
      const rin=p(x.rin,'Resistor de entrada/terra'),rf=p(x.rf,'Resistor de realimentação'),vin=number(x.vin),low=number(x.low),high=number(x.high);if(low>=high)throw Error('Limite inferior de saída deve ser menor que o superior.');const type=mode(x.type,['inv','noninv']),gain=type==='inv'?-rf/rin:1+rf/rin,ideal=gain*vin,clipped=Math.max(low,Math.min(high,ideal));
      values=[row('Saída ideal limitada',clipped,'V'),row('Ganho de sinal',gain,'V/V'),row('Ganho de ruído',1+rf/rin,'V/V'),row('Saída ideal sem limitação',ideal,'V')];formula=type==='inv'?'Av = −Rf / Rin; NG = 1 + Rf/Rin; Vout = Av × Vin':'Av = 1 + Rf / Rg; NG = Av; Vout = Av × Vin';steps=[`Av = ${gain}; Vout ideal = ${gain} × ${vin}`,`Saída limitada ao intervalo [${low}, ${high}] V`];note=`Amplificador ideal com referência em 0 V. ${ideal<low||ideal>high?'A saída ideal excede os limites informados: há saturação no modelo.':'A saída ideal está dentro dos limites informados.'} Informe limites reais de excursão, não apenas trilhos de alimentação. Não verifica modo comum, offset, corrente de saída, estabilidade ou recuperação de saturação.`;break;
    }
    case 'opamp-speed': {
      const gbw=p(x.gbw,'GBW')*1e6,ng=p(x.ng,'Ganho de ruído'),sr=p(x.sr,'Slew rate')*1e6,peak=p(x.peak,'Amplitude de pico');if(ng<1)throw Error('Ganho de ruído deve ser maior ou igual a 1.');const bw=gbw/ng,full=sr/(2*Math.PI*peak);
      values=[row('Limite estimado de frequência',Math.min(bw,full)/1000,'kHz'),row('Banda de pequeno sinal (−3 dB)',bw/1000,'kHz'),row('Limite por slew rate',full/1000,'kHz')];formula='BW ≈ GBW/NG; fSR = SR/(2π × Vpico); limite = min(BW, fSR)';steps=[`BW = ${gbw} / ${ng} Hz`,`fSR = ${sr} / (2π × ${peak}) Hz`];note='Amplificador com realimentação de tensão e aproximação de polo dominante. Use ganho de ruído, não módulo do ganho inversor. O menor limite é uma fronteira teórica, não banda garantida sem distorção. Não verifica margem de fase, capacitância de carga ou ganho mínimo estável; mantenha margem e confira o datasheet.';break;
    }
    case 'buck': {
      const vin=p(x.vin,'Entrada'),out=p(x.out,'Saída'),i=p(x.i,'Corrente de saída'),fs=p(x.fs,'Frequência de chaveamento')*1000,l=p(x.l,'Indutância')*1e-6,c=p(x.c,'Capacitância')*1e-6,esr=nn(x.esr,'ESR')/1000;if(out>=vin)throw Error('Buck exige tensão de saída menor que a entrada.');const d=out/vin,di=(vin-out)*d/(l*fs),imin=i-di/2,cap=di/(8*fs*c),res=di*esr;
      values=[row('Ripple de corrente pico a pico',di,'A'),row('Duty cycle ideal',d*100,'%'),row('Pico de corrente no indutor',i+di/2,'A'),row('Mínimo estimado no indutor',imin,'A'),row('Ripple de saída estimado',1000*(cap+res),'mVpp')];formula='D = Vo/Vi; ΔIL = (Vi−Vo)D/(Lfs); ΔVo ≲ ΔIL/(8fsC) + ESR × ΔIL';steps=[`D = ${out}/${vin}; ΔIL = (${vin}−${out}) × ${d}/(${l} × ${fs})`,`Imin = ${i} − ${di}/2; parcela capacitiva = ${cap} V; ESR = ${res} V`];note=`Modelo buck ideal em condução contínua (CCM). ${imin<=0?'CCM não é compatível com os dados: Imin ≤ 0; os resultados de ripple não são válidos para DCM.':'Imin > 0 é compatível com a hipótese CCM.'} Ripple é estimativa conservadora somando parcelas capacitiva e ESR. Não inclui perdas, transientes, estabilidade, tolerâncias ou saturação magnética.`;break;
    }
    case 'boost': {
      const vin=p(x.vin,'Entrada'),out=p(x.out,'Saída'),io=p(x.i,'Corrente de saída'),fs=p(x.fs,'Frequência de chaveamento')*1000,l=p(x.l,'Indutância')*1e-6,c=p(x.c,'Capacitância')*1e-6;if(out<=vin)throw Error('Boost exige tensão de saída maior que a entrada.');const d=1-vin/out,avg=io/(1-d),di=vin*d/(l*fs),imin=avg-di/2;
      values=[row('Pico de corrente no indutor',avg+di/2,'A'),row('Duty cycle ideal',d*100,'%'),row('Corrente média de entrada',avg,'A'),row('Ripple de corrente pico a pico',di,'A'),row('Mínimo estimado no indutor',imin,'A'),row('Ripple capacitivo de saída',io*d/(fs*c)*1000,'mVpp')];formula='D = 1−Vi/Vo; ILmédio = Io/(1−D); ΔIL = ViD/(Lfs); ΔVo ≈ IoD/(fsC)';steps=[`D = 1−${vin}/${out}; ILmédio = ${io}/(1−${d})`,`ΔIL = ${vin} × ${d}/(${l} × ${fs}); Imin = ${avg} − ${di}/2`];note=`Modelo boost ideal sem perdas em CCM. ${imin<=0?'CCM não é compatível com os dados: Imin ≤ 0; o modelo não é válido para DCM.':'Imin > 0 é compatível com a hipótese CCM.'} Ripple despreza ESR e transientes. Não dimensiona compensação, zeros no semiplano direito, corrente de chave, diodo ou limites do controlador.`;break;
    }
    case 'sallen-key': {
      const r=p(x.r,'Resistência'),c=p(x.c,'Capacitância')*1e-9,k=p(x.k,'Ganho K'),freq=nn(x.f,'Frequência de análise');if(k<1||k>=3)throw Error('Use ganho K no intervalo 1 ≤ K < 3 para este modelo.');const natural=1/(2*Math.PI*r*c),q=1/(3-k),u=freq/natural,gain=k/Math.hypot(1-u*u,u/q),yb=(2-1/(q*q)+Math.sqrt((1/(q*q)-2)**2+4))/2,cut=natural*Math.sqrt(yb);
      values=[row('Frequência natural f₀',natural,'Hz'),row('Fator de qualidade Q',q,''),row('Frequência de −3 dB relativa ao DC',cut,'Hz'),row('Ganho na frequência informada',gain,'V/V'),row('Ganho relativo ao DC',20*Math.log10(gain/k),'dB')];formula='f₀ = 1/(2πRC); Q = 1/(3−K); |H| = K/√[(1−u²)²+(u/Q)²], u=f/f₀';steps=[`f₀ = 1/(2π × ${r} × ${c}); Q = 1/(3−${k})`,`u = ${freq}/${natural}; |H| = ${gain}`];note='Sallen-Key passa-baixas de 2ª ordem com R1=R2=R e C1=C2=C, amplificador ideal não inversor de ganho K. f₀ coincide com o ponto de −3 dB somente para Q=1/√2. Não verifica GBW, slew rate, tolerâncias ou estabilidade real; K próximo de 3 torna Q muito sensível.';break;
    }
    case 'thermal': {
      const power=p(x.p,'Potência dissipada'),ambient=number(x.ta),max=number(x.tmax),jc=nn(x.jc,'θJC'),cs=nn(x.cs,'θCS'),sa=nn(x.sa,'θSA');if(ambient<-273.15||max<-273.15)throw Error('Temperatura não pode ser inferior ao zero absoluto.');if(max<=ambient)throw Error('Temperatura limite deve superar a ambiente.');const tj=ambient+power*(jc+cs+sa),allowed=(max-ambient)/power-jc-cs;
      values=[row('Temperatura de junção estimada',tj,'°C'),row('θSA máximo permitido pelo modelo',allowed,'°C/W'),row('Margem térmica',max-tj,'°C'),row('Resistência térmica total',jc+cs+sa,'°C/W')];formula='Tj = Ta + P(θJC+θCS+θSA); θSAmax = (Tlim−Ta)/P − θJC − θCS';steps=[`Tj = ${ambient} + ${power} × (${jc}+${cs}+${sa})`,`θSAmax = (${max}−${ambient})/${power} − ${jc} − ${cs}`];note=`Rede térmica série em regime permanente, predominância do caminho junção→encapsulamento→dissipador→ar. ${allowed<0?'Orçamento térmico negativo: nenhum dissipador passivo resolve estas hipóteses sem reduzir perdas ou resistências internas.':tj>max?'Temperatura estimada acima do limite informado.':'Temperatura estimada dentro do limite informado.'} Use θJC do caminho de montagem correto; não substitua por ψJT ou θJA. Não inclui aquecimento mútuo, PCB, transientes ou variação de fluxo de ar.`;break;
    }
    default: throw Error('Ferramenta não encontrada.');
  }
  if(values.some(r=>!Number.isFinite(r.value)))throw Error('Os valores excedem o intervalo numérico do cálculo. Reduza as grandezas.');
  if(id==='buck'&&values[3].value<=0||id==='boost'&&values[4].value<=0)warnings.push('Hipótese CCM não atendida. Os resultados são extrapolações do modelo; use análise DCM.');
  if(id==='adiabatic'&&values[3].value>100)warnings.push('Solicitação térmica acima do limite do condutor informado.');
  if(id==='thermal'&&values[2].value<0)warnings.push('Temperatura de junção acima do limite de projeto.');
  if(id==='opamp'&&values[0].value!==values[3].value)warnings.push('Saída limitada: o amplificador está saturado no modelo.');
  if(id==='drop-ac'&&Math.abs(values[1].value)>10)warnings.push('Variação elevada: confira o resultado por análise fasorial completa.');
  return {id,values,formula,steps,note,warnings,version:VERSION};
}
