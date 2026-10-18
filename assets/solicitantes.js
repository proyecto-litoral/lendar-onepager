/* Lendar — página de solicitantes: pasos, requisitos y simulador de préstamo */
(function(){
  "use strict";
  var L = window.Lendar;
  var TERM_OPTIONS = L.TERM_OPTIONS, pctLabel = L.pctLabel, termRateFor = L.termRateFor, fmt = L.fmt;

  var FLOW_STEPS = [
    {title:"Solicitá tu préstamo online", duration:"Instantáneo", description:"Te registrás, simulás tu préstamo y completás el formulario con tus datos. Te contactamos por teléfono en 1 a 3 días hábiles."},
    {title:"Reuní y enviá la documentación", duration:"A tu ritmo", description:"DNI, recibos de sueldo o facturación, escritura, impuesto inmobiliario y reserva de compraventa o ACM del gestor REMAX."},
    {title:"Aprobación y firma del contrato", duration:"Hasta 7 días hábiles", description:"Validamos tu capacidad crediticia y la propiedad, y firmás el contrato digital con Lendar, comprometiéndote a tomar el préstamo."},
    {title:"Escribanía, firma e hipoteca", duration:"15 a 45 días, según documentación del inmueble", description:"La escribanía revisa la documentación y el estado registral de la propiedad. Con el mutuo firmado, el inversor te presta el dinero y se constituye la hipoteca."},
    {title:"Pagá tus cuotas y listo", duration:"Todo el plazo", description:"Pagás una cuota fija en dólares al inversor cada mes, en efectivo o transferencia según lo acordado antes de la firma."}
  ];

  var WHY_LENDAR = [
    {
      title:"Comprá Hoy",
      text:"Como comprador, no necesitás juntar el 100% en efectivo para comprar hoy. Con el crédito Lendar —proceso 100% digital y aprobación en días— accedé a la casa que buscás con cuota fija, sin sorpresas cambiarias.",
      icon:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'
    },
    {
      title:"Operación Blindada",
      text:"Evitá que la operación se caiga por diferencia de cambio o discusión de gastos: se financian como parte del préstamo. Preaprobación estimada en menos de 7 días hábiles — la negociación no se enfría esperando al banco.",
      icon:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
    },
    {
      title:"Avanzá con Certeza",
      text:"Con la aprobación financiera de Lendar en trámite, ya podés avanzar y comprometer la operación con el comprador. Avanzás la venta mientras se completa el proceso, sin esperar el \u201csí\u201d definitivo del banco para cerrar el trato.",
      icon:'<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>'
    },
    {
      title:"Más Compradores",
      text:"Como gestor, marcá tus propiedades en venta como aptas para crédito Lendar. Ampliás el universo de compradores posibles —muchos llegan al precio pedido gracias al financiamiento— y ayudás a tu vendedor a cerrar más rápido, sin bajar el precio para apurar la operación.",
      icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
    }
  ];

  var REQUISITOS = [
    {
      title:"Información de quien solicita el dinero",
      icon:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      items:[
        "DNI en PDF",
        {label:"Ingresos en PDF", sub:[
          "En relación de dependencia: últimos 3 recibos de sueldo",
          "Monotributista: facturación de los últimos 6 meses",
          "Responsable inscripto: DDJJ de Ganancias"
        ]}
      ]
    },
    {
      title:"Información del inmueble a hipotecar",
      icon:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
      items:[
        "Copia de la escritura del inmueble",
        "Impuesto Inmobiliario y Catastro",
        "Documentación necesaria para escriturar según jurisdicción (planos, reglamento de co-propiedad, estado parcelario, etc. si correspondiera)",
        "Reserva de la compra-venta con: nombre, apellido, DNI y domicilio del comprador y del vendedor, y cláusula \u201cLendar\u201d",
        "Si no hay reserva: ACM / ficha de la propiedad a hipotecar con detalles y fotos"
      ]
    }
  ];

  var state = { role:"solicitante", loanAmount:25000, propertyValue:75000, term:60, vuyp:true };

  function fmt(n){ return Math.round(n).toLocaleString('es-AR'); }

  function calc(){
    var loanAmount = state.loanAmount, propertyValue = state.propertyValue, n = state.term, vuyp = state.vuyp;
    var ltv = (loanAmount/propertyValue)*100;

    var feeSolUSD = loanAmount * ((5.0*1.21)/100);
    var financedPrincipal = loanAmount + feeSolUSD;

    var annualRate = termRateFor(n);
    var i = annualRate/12;
    var monthly = n>0 ? (financedPrincipal*i*Math.pow(1+i,n))/(Math.pow(1+i,n)-1) : 0;

    var balance = financedPrincipal, totalInterest = 0, schedule = [];
    for(var p=1;p<=n;p++){
      var interest = balance*i;
      var principal = Math.min(balance, monthly-interest);
      balance = Math.max(0, balance-principal);
      totalInterest += interest;
      var iva = vuyp ? 0 : interest*0.21;
      schedule.push({period:p, principal:principal, interest:interest, iva:iva, payment:monthly+iva, balance:balance});
    }
    var totalReturned = 0, minP = Infinity, maxP = -Infinity;
    schedule.forEach(function(r){ totalReturned += r.payment; if(r.payment<minP) minP=r.payment; if(r.payment>maxP) maxP=r.payment; });

    return {ltv:ltv, monthly:monthly, feeSolUSD:feeSolUSD, financedPrincipal:financedPrincipal, schedule:schedule, totalInterest:totalInterest, totalReturned:totalReturned, minP:minP, maxP:maxP};
  }

  // ---- Steps timeline (static, glanceable — no click required) ----
  var timelineEl = document.getElementById('timeline');
  timelineEl.innerHTML = FLOW_STEPS.map(function(step, idx){
    return '<div class="tl-step">'+
      '<div class="tl-num">'+(idx+1)+'</div>'+
      '<div class="tl-head"><span class="tl-title">'+step.title+'</span><span class="tl-duration">⏱ '+step.duration+'</span></div>'+
      '<p class="tl-desc">'+step.description+'</p>'+
    '</div>';
  }).join('');

  // ---- Por qué Lendar (expandable persuasive cards) ----
  var whyGridEl = document.getElementById('whyGrid');
  whyGridEl.innerHTML = WHY_LENDAR.map(function(item, idx){
    return '<button type="button" class="why-card" id="whyCard'+idx+'">'+
      '<div class="why-head">'+
        '<span class="why-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+item.icon+'</svg></span>'+
        '<span class="why-title">'+item.title+'</span>'+
        '<svg class="why-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'+
      '</div>'+
      '<div class="why-body"><p class="why-text">'+item.text+'</p></div>'+
    '</button>';
  }).join('');
  WHY_LENDAR.forEach(function(item, idx){
    document.getElementById('whyCard'+idx).addEventListener('click', function(){
      this.classList.toggle('open');
    });
  });

  // ---- Qué necesito para pedir un Lendar (expandable requirement checklists) ----
  var reqGridEl = document.getElementById('reqGrid');
  reqGridEl.innerHTML = REQUISITOS.map(function(item, idx){
    var itemsHtml = item.items.map(function(t){
      if(typeof t === 'string'){ return '<li>'+t+'</li>'; }
      var subHtml = t.sub.map(function(s){ return '<li>'+s+'</li>'; }).join('');
      return '<li>'+t.label+'<ul class="why-sublist">'+subHtml+'</ul></li>';
    }).join('');
    return '<button type="button" class="why-card" id="reqCard'+idx+'">'+
      '<div class="why-head">'+
        '<span class="why-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+item.icon+'</svg></span>'+
        '<span class="why-title">'+item.title+'</span>'+
        '<svg class="why-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'+
      '</div>'+
      '<div class="why-body"><ul class="why-list">'+itemsHtml+'</ul></div>'+
    '</button>';
  }).join('');
  REQUISITOS.forEach(function(item, idx){
    document.getElementById('reqCard'+idx).addEventListener('click', function(){
      this.classList.toggle('open');
    });
  });

  // ---- Calculator ----
  var propSlider = document.getElementById('propSlider');
  var loanSlider = document.getElementById('loanSlider');
  var vuypCheck = document.getElementById('vuypCheck');
  var termGrid = document.getElementById('termGrid');
  TERM_OPTIONS.forEach(function(t){
    var btn = document.createElement('button');
    btn.className = 'term-btn';
    btn.innerHTML = '<span class="term-btn-years">'+t.years+'</span><span class="term-btn-rate">'+pctLabel(t.rate)+'</span>';
    btn.setAttribute('data-term', t.m);
    btn.addEventListener('click', function(){ state.term = t.m; renderCalc(); });
    termGrid.appendChild(btn);
  });

  propSlider.addEventListener('input', function(){
    var val = parseInt(propSlider.value, 10);
    var minAllowed = Math.ceil(state.loanAmount/0.35);
    state.propertyValue = Math.max(minAllowed, val);
    renderCalc();
  });
  loanSlider.addEventListener('input', function(){
    var val = parseInt(loanSlider.value, 10);
    state.loanAmount = val;
    state.propertyValue = Math.ceil(val/0.35);
    renderCalc();
  });
  vuypCheck.addEventListener('change', function(){ state.vuyp = vuypCheck.checked; renderCalc(); });

  function renderCalc(){
    propSlider.value = state.propertyValue;
    loanSlider.value = state.loanAmount;
    vuypCheck.checked = state.vuyp;

    document.getElementById('propValLabel').innerHTML = fmt(state.propertyValue)+'<span class="unit-sm">USD</span>';
    document.getElementById('loanValLabel').innerHTML = fmt(state.loanAmount)+'<span class="unit-sm">USD</span>';
    var minAllowed = Math.ceil(state.loanAmount/0.35);
    document.getElementById('minPropNote').classList.toggle('hidden', state.propertyValue > minAllowed);

    Array.prototype.forEach.call(termGrid.querySelectorAll('.term-btn'), function(btn){
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-term'),10) === state.term);
    });

    var c = calc();

    document.getElementById('ltvWarning').classList.toggle('hidden', c.ltv <= 35);

    var resultPayment = document.getElementById('resultPayment');
    var resultSub = document.getElementById('resultSub');
    if(state.vuyp){
      resultPayment.innerHTML = fmt(c.monthly)+'<span class="unit">USD / mes</span>';
      resultSub.textContent = '';
    } else {
      resultPayment.innerHTML = '<span class="range-word">entre</span> '+fmt(c.minP)+' <span class="range-word">y</span> '+fmt(c.maxP)+'<span class="unit">USD / mes</span>';
      resultSub.textContent = 'El préstamo tributa IVA sobre los intereses';
    }

    document.getElementById('feeBaseLabel').textContent = fmt(state.loanAmount)+' USD';
    document.getElementById('feeSolLabel').textContent = fmt(c.feeSolUSD)+' USD';

    var tbody = document.getElementById('tableBody');
    var rows = c.schedule.map(function(r){
      return '<tr><td class="c-period">'+r.period+'</td>'+
        '<td class="c-amort">'+fmt(r.principal)+'</td>'+
        '<td class="c-int">'+fmt(r.interest)+'</td>'+
        '<td class="c-iva">'+fmt(r.iva)+'</td>'+
        '<td class="c-payment">'+fmt(r.payment)+'</td>'+
        '<td class="c-balance">'+fmt(r.balance)+'</td></tr>';
    });
    tbody.innerHTML = rows.join('');
  }

  // ---- Amortization table toggle (collapsed by default, inside the calculator) ----
  document.getElementById('tableToggleBtn').addEventListener('click', function(){
    this.classList.toggle('open');
    document.getElementById('tableWrap').classList.toggle('collapsed');
  });

  renderCalc();
})();
