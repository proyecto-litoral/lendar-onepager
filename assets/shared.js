/* Lendar — funciones y datos compartidos por las páginas de solicitantes e inversores */
(function(){
  "use strict";

  var ESCRIBANIAS = [
    {city:"Santa Fe", name:"Escribanía Culzoni & Zanetta", address:"San Martin 3262, Santa Fe", email:"escribaniaculzoni@gmail.com", offices:["Remax Santa Fe Capital","Remax Fortaleza (Esperanza)","Remax Conquista (Reconquista)"]},
    {city:"Rafaela", name:"Escribanía Eguiazu", address:"Moreno 240, Rafaela", email:"hipotecas@escribaniaeguiazu.com.ar", offices:["Remax Confianza (Rafaela)"]},
    {city:"Rosario I", name:"Escribanía Alegre", address:"Córdoba 1438 Piso 2, Of. 01, Rosario", email:"escribaniaalegre@gmail.com", offices:["Remax Forum","Remax Terra","Remax Select","Remax Colonial","Remax Tendencia","Remax Flor"]},
    {city:"Rosario II", name:"Verónica Ferreyra", address:"San Martín 647, Piso 5, Rosario", email:"escribanaferreyra@gmail.com", offices:["Remax Exclusivo","Remax Vip"]},
    {city:"Paraná", name:"Escribanía Quinodoz", address:"San Martín 228, Paraná", email:"escribaniaquinodoz@gmail.com", offices:["Remax Por Más (Paraná)"]}
  ];

  var TERM_OPTIONS = [
    {m:12, years:'1 año', rate:0.095},
    {m:24, years:'2 años', rate:0.105},
    {m:36, years:'3 años', rate:0.115},
    {m:48, years:'4 años', rate:0.125},
    {m:60, years:'5 años', rate:0.135}
  ];
  function pctLabel(r){ return (r*100).toFixed(1).replace('.',',')+'%'; }
  function termRateFor(m){
    for(var k=0;k<TERM_OPTIONS.length;k++){ if(TERM_OPTIONS[k].m===m) return TERM_OPTIONS[k].rate; }
    return TERM_OPTIONS[TERM_OPTIONS.length-1].rate;
  }

  function fmt(n){ return Math.round(n).toLocaleString('es-AR'); }


  // ---- Simulador: ayudas de interfaz (no tocan los cálculos) ----
  function paintRanges(){
    Array.prototype.forEach.call(document.querySelectorAll('input[type=range]'), function(r){
      var min = parseFloat(r.min) || 0, max = parseFloat(r.max) || 100, v = parseFloat(r.value) || 0;
      r.style.setProperty('--p', (max > min ? ((v-min)/(max-min))*100 : 0) + '%');
    });
  }
  document.addEventListener('input', function(e){
    if(e.target && e.target.type === 'range') paintRanges();
  });

  function setAmount(out, n){
    if(out) out.value = fmt(n);
  }

  function quickChips(box, values, onPick){
    values.forEach(function(v){
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'quick-chip'; b.setAttribute('data-v', v);
      b.textContent = fmt(v);
      b.addEventListener('click', function(){ onPick(v); });
      box.appendChild(b);
    });
  }
  function markQuick(box, current){
    Array.prototype.forEach.call(box.querySelectorAll('.quick-chip'), function(b){
      b.classList.toggle('on', parseInt(b.getAttribute('data-v'), 10) === current);
    });
  }

  function pop(el){
    if(!el) return;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }

  // Barra fija con el resultado (solo celular): aparece mientras el simulador está en pantalla
  // y la tarjeta de resultado no.
  function syncSticky(srcEl){
    var v = document.getElementById('stickyValue');
    if(v && srcEl) v.innerHTML = srcEl.innerHTML;
  }
  (function(){
    var bar = document.getElementById('stickyResult');
    var sim = document.getElementById('simulador');
    var box = document.querySelector('.result-box');
    if(!bar || !sim || !box) return;
    var ticking = false;
    function update(){
      ticking = false;
      var vh = window.innerHeight, s = (sim.querySelector('.sec-card') || sim).getBoundingClientRect(), r = box.getBoundingClientRect();
      var inSim = s.top < vh * 0.6 && s.bottom > vh * 0.8;
      var boxVisible = r.top < vh - 60 && r.bottom > 60;
      var show = inSim && !boxVisible;
      bar.classList.toggle('show', show);
      document.body.classList.toggle('has-sticky', show);
    }
    function req(){ if(!ticking){ ticking = true; window.requestAnimationFrame(update); } }
    window.addEventListener('scroll', req, {passive:true});
    window.addEventListener('resize', req);
    update();
  })();

  window.Lendar = { TERM_OPTIONS:TERM_OPTIONS, pctLabel:pctLabel, termRateFor:termRateFor, fmt:fmt,
    paintRanges:paintRanges, setAmount:setAmount, quickChips:quickChips, markQuick:markQuick, pop:pop, syncSticky:syncSticky };

  // ---- Directory ----
  var dirGrid = document.getElementById('dirGrid');
  var EMAIL_SUBJECT = 'Consulta sobre crédito Lendar';
  var EMAIL_BODY = 'Tengo una consulta sobre un crédito Lendar:';
  ESCRIBANIAS.forEach(function(esc){
    var card = document.createElement('div');
    card.className = 'dir-card';
    var officesHtml = esc.offices.map(function(o){ return '<span class="dir-office">• '+o+'</span>'; }).join('');
    var mailtoHref = 'mailto:'+esc.email+'?subject='+encodeURIComponent(EMAIL_SUBJECT)+'&body='+encodeURIComponent(EMAIL_BODY);
    card.innerHTML = '<div class="dir-content">'+
      '<span class="dir-city">'+esc.city+'</span>'+
      '<h5 class="dir-name">'+esc.name+'</h5>'+
      '<div class="dir-addr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>'+esc.address+'</span></div>'+
      '<div><span class="dir-offices-label">Oficinas Remax Asociadas:</span><div>'+officesHtml+'</div></div>'+
    '</div>'+
      '<a class="dir-contact-btn" href="'+mailtoHref+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>Contactar</a>';
    dirGrid.appendChild(card);
  });

  // ---- Índice fijo: resalta la sección que se está leyendo ----
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chips a'));
  if(chips.length && 'IntersectionObserver' in window){
    var byId = {};
    chips.forEach(function(a){ byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          chips.forEach(function(a){ a.classList.remove('on'); });
          var a = byId[en.target.id];
          if(a){
            a.classList.add('on');
            var bar = a.parentNode;
            bar.scrollTo({left: a.offsetLeft - 16, behavior:'smooth'});
          }
        }
      });
    }, {rootMargin:'-35% 0px -60% 0px'});
    Object.keys(byId).forEach(function(id){ var el = document.getElementById(id); if(el) io.observe(el); });
  }
})();
