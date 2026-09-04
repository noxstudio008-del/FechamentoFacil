const $=id=>document.getElementById(id);
let records=[];
let savedHistory=JSON.parse(localStorage.getItem('ff_history')||'[]');

const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

function rec(d={}){
  return {
    id:Date.now()+Math.random(),
    client:d.client||'',
    trucks:+d.trucks||0,
    origin:d.origin||'',
    destination:d.destination||'',
    price:+d.price||0
  };
}

function filtered(){
  const q=$('search').value.toLowerCase().trim();
  const o=$('originFilter').value;
  const d=$('destinationFilter').value;
  return records.filter(r=>
    (!q||[r.client,r.origin,r.destination].join(' ').toLowerCase().includes(q))&&
    (!o||r.origin===o)&&
    (!d||r.destination===d)
  );
}

function renderFilters(){
  const origins=[...new Set(records.map(r=>r.origin).filter(Boolean))].sort();
  const dest=[...new Set(records.map(r=>r.destination).filter(Boolean))].sort();
  const ov=$('originFilter').value;
  const dv=$('destinationFilter').value;

  $('originFilter').innerHTML='<option value="">Todas as origens</option>'+
    origins.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');

  $('destinationFilter').innerHTML='<option value="">Todas as entregas</option>'+
    dest.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');

  $('originFilter').value=origins.includes(ov)?ov:'';
  $('destinationFilter').value=dest.includes(dv)?dv:'';
}

function updateSummary(list){
  const t=list.reduce((s,r)=>s+r.trucks,0);
  const v=list.reduce((s,r)=>s+r.trucks*r.price,0);
  $('totalTrucks').textContent=t;
  $('totalRecords').textContent=records.length;
  $('grandTotal').textContent=money(v);
  $('footerTotal').textContent=money(v);
}

function updateVisibleTotals(){
  const list=filtered();
  const value=list.reduce((s,r)=>s+r.trucks*r.price,0);
  $('grandTotal').textContent=money(value);
  $('footerTotal').textContent=money(value);
  $('totalTrucks').textContent=list.reduce((s,r)=>s+r.trucks,0);
  $('totalRecords').textContent=records.length;

  document.querySelectorAll('[data-id]').forEach(input=>{
    const r=records.find(x=>String(x.id)===String(input.dataset.id));
    if(!r)return;
    const card=input.closest('.mobile-card');
    const row=input.closest('tr');
    if(row){
      const total=row.querySelector('.row-total');
      if(total)total.textContent=money(r.trucks*r.price);
    }
    if(card){
      const total=card.querySelector('.mobile-total');
      if(total)total.textContent=money(r.trucks*r.price);
      const client=card.querySelector('.mobile-client');
      if(client)client.textContent=r.client||'Novo cliente';
      const route=card.querySelector('.mobile-route');
      if(route)route.textContent=`${r.origin||'Origem'} → ${r.destination||'Entrega'}`;
    }
  });
}

function render(){
  renderFilters();
  const list=filtered();
  $('tbody').innerHTML='';
  $('mobileList').innerHTML='';

  list.forEach(r=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><input data-id="${r.id}" data-f="client" value="${esc(r.client)}" placeholder="Cliente"></td>
      <td><input type="number" min="0" data-id="${r.id}" data-f="trucks" value="${r.trucks||''}"></td>
      <td><input data-id="${r.id}" data-f="origin" value="${esc(r.origin)}" placeholder="Cidade"></td>
      <td><input data-id="${r.id}" data-f="destination" value="${esc(r.destination)}" placeholder="Cidade"></td>
      <td><input type="number" min="0" step="0.01" data-id="${r.id}" data-f="price" value="${r.price||''}"></td>
      <td class="row-total">${money(r.trucks*r.price)}</td>
      <td><button class="delete" data-del="${r.id}">Excluir</button></td>`;
    $('tbody').appendChild(tr);

    const card=document.createElement('div');
    card.className='mobile-card';
    card.innerHTML=`<div class="mobile-top"><span class="mobile-client">${esc(r.client)||'Novo cliente'}</span><span class="mobile-total">${money(r.trucks*r.price)}</span></div>
      <div class="mobile-route">${esc(r.origin)||'Origem'} → ${esc(r.destination)||'Entrega'}</div>
      <div class="mobile-fields">
        <label>Caminhões<input type="number" min="0" data-id="${r.id}" data-f="trucks" value="${r.trucks||''}"></label>
        <label>Preço / caminhão<input type="number" min="0" step="0.01" data-id="${r.id}" data-f="price" value="${r.price||''}"></label>
        <label>Cliente<input data-id="${r.id}" data-f="client" value="${esc(r.client)}"></label>
        <label>Origem<input data-id="${r.id}" data-f="origin" value="${esc(r.origin)}"></label>
        <label>Entrega<input data-id="${r.id}" data-f="destination" value="${esc(r.destination)}"></label>
      </div>
      <button class="mobile-delete" data-del="${r.id}">Excluir registro</button>`;
    $('mobileList').appendChild(card);
  });

  $('empty').style.display=list.length?'none':'block';
  updateSummary(list);
}

document.addEventListener('input',e=>{
  if(!e.target.dataset.f)return;
  const r=records.find(x=>String(x.id)===String(e.target.dataset.id));
  if(!r)return;

  const f=e.target.dataset.f;
  r[f]=(f==='trucks'||f==='price')?(+e.target.value||0):e.target.value;
  updateVisibleTotals();
});

document.addEventListener('change',e=>{
  if(e.target.dataset.f)render();
});

document.addEventListener('click',e=>{
  const id=e.target.dataset.del;
  if(id){
    records=records.filter(r=>String(r.id)!==String(id));
    render();
  }
});

function addRecord(){
  const newRecord=rec();
  records.push(newRecord);
  render();
  requestAnimationFrame(()=>{
    const input=document.querySelector(`[data-id="${newRecord.id}"][data-f="client"]`);
    if(input)input.focus();
  });
}

$('addBtn').onclick=addRecord;
$('emptyBtn').onclick=addRecord;
$('search').oninput=render;
$('originFilter').onchange=render;
$('destinationFilter').onchange=render;

$('clearBtn').onclick=()=>{
  if(confirm('Limpar todos os registros deste fechamento?')){
    records=[];
    render();
  }
};

$('demoBtn').onclick=()=>{
  records=[
    rec({client:'Fazenda Exemplo A',trucks:10,origin:'Lavras',destination:'Varginha',price:350}),
    rec({client:'Fazenda Exemplo B',trucks:7,origin:'Campanha',destination:'Três Corações',price:420}),
    rec({client:'Fazenda Exemplo C',trucks:15,origin:'Nepomuceno',destination:'Lavras',price:390})
  ];
  render();
};

$('saveBtn').onclick=()=>{
  const month=$('month').value||'Sem mês';
  const total=records.reduce((s,r)=>s+r.trucks*r.price,0);
  savedHistory.unshift({
    id:Date.now(),
    month,
    count:records.length,
    total,
    records:JSON.parse(JSON.stringify(records))
  });
  savedHistory=savedHistory.slice(0,12);
  localStorage.setItem('ff_history',JSON.stringify(savedHistory));
  renderHistory();
  alert('Fechamento salvo com sucesso.');
};

function renderHistory(){
  $('history').innerHTML=savedHistory.length
    ?savedHistory.map(x=>`<div class="history-row"><div><strong>${esc(x.month)}</strong><small>${x.count} registros · ${money(x.total)}</small></div><button class="secondary" data-load="${x.id}">Abrir</button></div>`).join('')
    :'<div class="history-row"><small>Nenhum fechamento salvo.</small></div>';
}

document.addEventListener('click',e=>{
  const id=e.target.dataset.load;
  if(id){
    const x=savedHistory.find(a=>String(a.id)===String(id));
    if(x){
      records=x.records.map(rec);
      $('month').value=x.month;
      render();
      window.scrollTo({top:0,behavior:'smooth'});
    }
  }
});

$('exportBtn').onclick=()=>{
  if(!records.length){
    alert('Não há registros para exportar.');
    return;
  }

  const rows=[
    ['Cliente','Caminhões','Origem','Entrega','Preço por caminhão','Total'],
    ...records.map(r=>[
      r.client,
      r.trucks,
      r.origin,
      r.destination,
      r.price,
      (r.trucks*r.price).toFixed(2)
    ])
  ];

  const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');
  a.href=url;
  a.download='fechamento.csv';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};

$('helpBtn').onclick=()=>$('modal').classList.add('open');
$('closeHelp').onclick=()=>$('modal').classList.remove('open');
$('modal').onclick=e=>{
  if(e.target===$('modal'))$('modal').classList.remove('open');
};

const now=new Date();
$('month').value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
render();
renderHistory();
