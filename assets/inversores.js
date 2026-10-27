/* Lendar — página de inversores: simulador de inversión y detalle de cuotas en PDF */
(function(){
  "use strict";
  var L = window.Lendar;
  var TERM_OPTIONS = L.TERM_OPTIONS, pctLabel = L.pctLabel, termRateFor = L.termRateFor, fmt = L.fmt;

  var invState = { amount:10000, term:60, delivery:'efectivo', payout:'efectivo' };

  var DELIVERY_OPTIONS = [
    {key:'efectivo', label:'Efectivo', text:'Llevás el dinero en efectivo al momento de la firma.'},
    {key:'transferencia', label:'Transferencia', text:'Asistís a la firma y en vivo hacés la transferencia del dinero.'}
  ];
  var PAYOUT_OPTIONS = [
    {key:'efectivo', label:'Efectivo', text:'Te pagan la cuota mensual en efectivo en el domicilio que determines cercano al lugar de firma.'},
    {key:'transferencia', label:'Transferencia', text:'Te pagan mensualmente al CBU que definas.'}
  ];

  function invCalc(){
    var P = invState.amount, n = invState.term;
    var i = termRateFor(n)/12;
    var monthly = n>0 ? (P*i*Math.pow(1+i,n))/(Math.pow(1+i,n)-1) : 0;
    var balance = P, schedule = [];
    for(var p=1;p<=n;p++){
      var interest = balance*i;
      var principal = Math.min(balance, monthly-interest);
      balance = Math.max(0, balance-principal);
      schedule.push({period:p, principal:principal, interest:interest, payment:monthly, balance:balance});
    }
    return {monthly:monthly, schedule:schedule};
  }

  var invAmountSlider = document.getElementById('invAmountSlider');
  var invTermGrid = document.getElementById('invTermGrid');
  TERM_OPTIONS.forEach(function(t){
    var btn = document.createElement('button');
    btn.className = 'term-btn';
    btn.innerHTML = '<span class="term-btn-years">'+t.years+'</span><span class="term-btn-rate">'+pctLabel(t.rate)+'</span>';
    btn.setAttribute('data-term', t.m);
    btn.addEventListener('click', function(){ invState.term = t.m; renderInv(); });
    invTermGrid.appendChild(btn);
  });

  var deliveryGrid = document.getElementById('deliveryGrid');
  DELIVERY_OPTIONS.forEach(function(opt){
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice-btn';
    btn.textContent = opt.label;
    btn.setAttribute('data-key', opt.key);
    btn.addEventListener('click', function(){ invState.delivery = opt.key; renderInv(); });
    deliveryGrid.appendChild(btn);
  });

  var payoutGrid = document.getElementById('payoutGrid');
  PAYOUT_OPTIONS.forEach(function(opt){
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice-btn';
    btn.textContent = opt.label;
    btn.setAttribute('data-key', opt.key);
    btn.addEventListener('click', function(){ invState.payout = opt.key; renderInv(); });
    payoutGrid.appendChild(btn);
  });

  var invAmountInput = document.getElementById('invAmountInput');
  var invQuick = document.getElementById('invQuick');
  function setInvAmount(v){ invState.amount = v; renderInv(); }
  invAmountSlider.addEventListener('input', function(){ setInvAmount(parseInt(invAmountSlider.value, 10)); });
  L.quickChips(invQuick, [10000, 50000, 100000, 300000], setInvAmount);

  function renderInv(){
    invAmountSlider.value = invState.amount;
    L.setAmount(invAmountInput, invState.amount);
    L.markQuick(invQuick, invState.amount);

    Array.prototype.forEach.call(invTermGrid.querySelectorAll('.term-btn'), function(btn){
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-term'),10) === invState.term);
    });
    Array.prototype.forEach.call(deliveryGrid.querySelectorAll('.choice-btn'), function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-key') === invState.delivery);
    });
    Array.prototype.forEach.call(payoutGrid.querySelectorAll('.choice-btn'), function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-key') === invState.payout);
    });

    var deliveryOpt = DELIVERY_OPTIONS.filter(function(o){ return o.key===invState.delivery; })[0];
    document.getElementById('deliveryNote').textContent = deliveryOpt ? deliveryOpt.text : '';
    var payoutOpt = PAYOUT_OPTIONS.filter(function(o){ return o.key===invState.payout; })[0];
    document.getElementById('payoutNote').textContent = payoutOpt ? payoutOpt.text : '';

    var invBrokerage = invState.amount >= 40000 ? 0.010 : 0.015;
    var invFeeUSD = invState.amount * invBrokerage;
    document.getElementById('invFeePctLabel').textContent = '('+pctLabel(invBrokerage)+' del monto invertido)';
    document.getElementById('invFeeAmountLabel').textContent = fmt(invFeeUSD)+' USD';

    var c = invCalc();
    document.getElementById('invResultPayment').innerHTML = fmt(c.monthly)+'<span class="unit">USD / mes</span>';
    var invTermOpt = TERM_OPTIONS.filter(function(t){ return t.m === invState.term; })[0];
    document.getElementById('invFactTerm').textContent = invTermOpt ? invTermOpt.years : '';
    document.getElementById('invFactRate').textContent = pctLabel(termRateFor(invState.term));
    L.pop(document.getElementById('invResultPayment'));
    L.syncSticky(document.getElementById('invResultPayment'));

    var tbody = document.getElementById('invTableBody');
    var rows = c.schedule.map(function(r){
      return '<tr><td class="c-period">'+r.period+'</td>'+
        '<td class="c-amort">'+fmt(r.principal)+'</td>'+
        '<td class="c-int">'+fmt(r.interest)+'</td>'+
        '<td class="c-payment">'+fmt(r.payment)+'</td>'+
        '<td class="c-balance">'+fmt(r.balance)+'</td></tr>';
    });
    tbody.innerHTML = rows.join('');
    L.paintRanges();
  }

  document.getElementById('invTableToggleBtn').addEventListener('click', function(){
    this.classList.toggle('open');
    document.getElementById('invTableWrap').classList.toggle('collapsed');
    document.getElementById('invDownloadWrap').classList.toggle('hidden');
  });

  // ---- PDF: snapshot del detalle de cuotas del inversor (vía impresión nativa del navegador) ----
  function generateInvPdf(){
    var c = invCalc();
    var invBrokerage = invState.amount >= 40000 ? 0.010 : 0.015;
    var invFeeUSD = invState.amount * invBrokerage;
    var termOpt = TERM_OPTIONS.filter(function(t){ return t.m === invState.term; })[0];
    var termYearsLabel = termOpt ? termOpt.years : (invState.term+' meses');
    var termRate = termRateFor(invState.term);
    var todayStr = new Date().toLocaleDateString('es-AR');

    var rows = c.schedule.map(function(r){
      return '<tr><td class="p-period">'+r.period+'</td>'+
        '<td>'+fmt(r.principal)+' USD</td>'+
        '<td>'+fmt(r.interest)+' USD</td>'+
        '<td>'+fmt(r.payment)+' USD</td>'+
        '<td>'+fmt(r.balance)+' USD</td></tr>';
    }).join('');

    var html = '<!doctype html><html lang="es"><head><meta charset="UTF-8">'+
      '<title>Lendar — Detalle de cuotas de inversión</title>'+
      '<style>'+
      '@page{ size:A4; margin:16mm 14mm; }'+
      '*{box-sizing:border-box;}'+
      'body{font-family:Arial,Calibri,sans-serif;color:#58595B;margin:0;padding:0;}'+
      '.p-header{background:#231F20;color:#fff;padding:18px 22px;border-radius:10px;margin-bottom:20px;}'+
      '.p-logo{font-size:20px;font-weight:800;margin:0 0 4px;}'+
      '.p-sub{font-size:12.5px;color:#4EC3C4;margin:0;}'+
      '.p-date{font-size:10px;color:#C9CACB;text-align:right;margin-top:-30px;}'+
      '.p-section-title{font-size:13.5px;font-weight:800;color:#746AAB;text-transform:uppercase;letter-spacing:.03em;margin:22px 0 10px;}'+
      '.p-summary{width:100%;border-collapse:collapse;margin-bottom:6px;}'+
      '.p-summary td{padding:6px 0;font-size:12.5px;border-bottom:1px solid #F1F2F3;}'+
      '.p-summary td:first-child{font-weight:800;color:#231F20;width:220px;}'+
      '.p-summary td:last-child{font-family:"Courier New",monospace;color:#58595B;}'+
      'table.p-table{width:100%;border-collapse:collapse;font-size:10.5px;}'+
      'table.p-table th{background:#4EC3C4;color:#fff;font-weight:800;padding:7px 8px;text-align:right;}'+
      'table.p-table th.p-period{text-align:center;}'+
      'table.p-table td{padding:5px 8px;text-align:right;border-bottom:1px solid #F1F2F3;font-family:"Courier New",monospace;}'+
      'table.p-table td.p-period{text-align:center;font-family:Arial,sans-serif;font-weight:700;color:#9B9C9E;}'+
      'table.p-table tr:nth-child(even){background:#FAFBFB;}'+
      '.p-foot{font-size:9px;color:#9B9C9E;margin-top:18px;line-height:1.5;}'+
      '@media print{ .p-noprint{ display:none; } }'+
      '</style></head><body>'+
      '<div class="p-noprint" style="text-align:right;padding:10px 14px;font-family:Arial,sans-serif;font-size:12px;color:#58595B;">Elegí <strong>"Guardar como PDF"</strong> como destino de impresión y hacé clic en Guardar.</div>'+
      '<div class="p-header">'+
        '<div class="p-logo">Lendar</div>'+
        '<p class="p-sub">Detalle de cuotas — Simulador de inversión</p>'+
      '</div>'+
      '<div class="p-date">Generado el '+todayStr+'</div>'+
      '<div class="p-section-title">Resumen de la inversión</div>'+
      '<table class="p-summary">'+
        '<tr><td>Monto invertido</td><td>'+fmt(invState.amount)+' USD</td></tr>'+
        '<tr><td>Comisión Lendar</td><td>'+fmt(invFeeUSD)+' USD ('+pctLabel(invBrokerage)+' del monto invertido)</td></tr>'+
        '<tr><td>Duración</td><td>'+termYearsLabel+' ('+invState.term+' cuotas mensuales)</td></tr>'+
        '<tr><td>Tasa (TNA)</td><td>'+pctLabel(termRate)+'</td></tr>'+
        '<tr><td>Cobro mensual estimado</td><td>'+fmt(c.monthly)+' USD / mes</td></tr>'+
      '</table>'+
      '<div class="p-section-title">Tabla de cuotas mes a mes</div>'+
      '<table class="p-table">'+
        '<thead><tr><th class="p-period">N° Cuota</th><th>Amortización</th><th>Interés</th><th>Cuota Total</th><th>Saldo Deudor</th></tr></thead>'+
        '<tbody>'+rows+'</tbody>'+
      '</table>'+
      '<p class="p-foot">Esta información es orientativa y no constituye una oferta vinculante ni asesoramiento financiero o legal. Los valores finales quedan sujetos al contrato firmado con Lendar.</p>'+
      '</body></html>';

    var win = window.open('', '_blank');
    if(!win){
      alert('Tu navegador bloqueó la ventana emergente. Habilitá los pop-ups para este sitio e intentá de nuevo.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(function(){
      win.focus();
      win.print();
    }, 250);
  }
  document.getElementById('invDownloadPdfBtn').addEventListener('click', generateInvPdf);

  renderInv();
})();
