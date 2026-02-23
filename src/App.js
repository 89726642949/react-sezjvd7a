import React, { useState, useEffect, useCallback } from "react";

// ─── Cores ────────────────────────────────────────────────────────────────────
const G = {
  bg: "#f0f5ff",
  surface: "#ffffff",
  card: "#ffffff",
  border: "#dce7f8",
  accent: "#ff8c42",
  accentSoft: "rgba(255,140,66,0.13)",
  gold: "#ff6b1a",
  red: "#e05c2a",
  redSoft: "rgba(224,92,42,0.11)",
  blue: "#4a90d9",
  blueSoft: "rgba(74,144,217,0.11)",
  text: "#1a2a4a",
  muted: "#7a90b8",
  dim: "#b0c4de",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    font-family: 'DM Sans', sans-serif;
    background: linear-gradient(135deg, #f0f5ff 0%, #fff4ee 100%) fixed;
    color: #1a2a4a;
    -webkit-tap-highlight-color: transparent;
  }
  input, select, textarea { font-family: 'DM Sans', sans-serif; }
  button { font-family: 'DM Sans', sans-serif; cursor: pointer; }
  @keyframes fadeSlide { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes glow { 0%,100% { box-shadow:0 0 10px #ff8c4255; } 50% { box-shadow:0 0 24px #ff8c4299; } }
  .fade { animation: fadeSlide 0.28s ease both; }
  .stat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:10px; margin-bottom:22px; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  @media(max-width:640px){
    .two-col { grid-template-columns:1fr; }
    .stat-grid { grid-template-columns:1fr 1fr; }
    .desk-label { display:none !important; }
  }
`;

// ─── Utils ────────────────────────────────────────────────────────────────────
const uid   = () => Math.random().toString(36).slice(2,9);
const today = () => new Date().toISOString().split("T")[0];
const fmtDate  = (d) => d ? new Date(d+"T12:00:00").toLocaleDateString("pt-BR") : "—";
const fmtMoney = (v) => "R$ "+Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2});
const daysLeft = (d) => d ? Math.ceil((new Date(d)-new Date())/86400000) : null;

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS = {
  get: (k) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):null; } catch { return null; } },
  set: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} },
};

// ─── Seed ─────────────────────────────────────────────────────────────────────
const SEED = {
  subs: [
    {id:uid(),name:"Claude Pro",    provider:"Anthropic",  cost:99,  cycle:"mensal",renewal:"2025-04-15",status:"ativo",notes:""},
    {id:uid(),name:"ChatGPT Plus",  provider:"OpenAI",     cost:99,  cycle:"mensal",renewal:"2025-04-20",status:"ativo",notes:""},
    {id:uid(),name:"Midjourney",    provider:"Midjourney", cost:52,  cycle:"mensal",renewal:"2025-03-10",status:"ativo",notes:""},
    {id:uid(),name:"Notion AI",     provider:"Notion",     cost:45,  cycle:"mensal",renewal:"2025-05-01",status:"pausado",notes:""},
  ],
  domains: [
    {id:uid(),domain:"silmara.dev",    registrar:"Registro.br",cost:39.90,renewal:"2025-11-20",hosting:"Vercel",   hostingCost:0,    status:"ativo"},
    {id:uid(),domain:"meusite.com.br", registrar:"HostGator",  cost:49.90,renewal:"2025-06-05",hosting:"HostGator",hostingCost:25.90,status:"ativo"},
  ],
  finances: [
    {id:uid(),desc:"Assinaturas IA",    amount:295,  category:"Tecnologia",    date:today(),recurrent:true },
    {id:uid(),desc:"Hospedagem mensal", amount:25.90,category:"Infraestrutura",date:today(),recurrent:true },
  ],
  projects: [
    {id:uid(),name:"App Painel Pessoal",client:"Interno",  status:"em andamento",priority:"alta",  deadline:"2025-03-30",budget:0,   notes:"Dashboard de controle"},
    {id:uid(),name:"Site Portfolio",    client:"Interno",  status:"planejando",  priority:"média",deadline:"2025-04-15",budget:500, notes:"Novo portfolio 2025"},
    {id:uid(),name:"Automação N8N",     client:"Cliente B",status:"concluído",  priority:"alta",  deadline:"2025-02-28",budget:2000,notes:"Fluxo de onboarding"},
  ],
};

// ─── Atoms ────────────────────────────────────────────────────────────────────
function Badge({children,color=G.accent}){
  return <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700,whiteSpace:"nowrap",fontFamily:"'JetBrains Mono'"}}>{children}</span>;
}

function Stat({icon,label,value,color=G.accent}){
  return(
    <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:14,padding:"16px",position:"relative",overflow:"hidden",boxShadow:"0 2px 10px rgba(74,144,217,0.08)"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${color},transparent)`}}/>
      <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
      <div style={{fontFamily:"'JetBrains Mono'",fontSize:16,fontWeight:700,color,lineHeight:1.2}}>{value}</div>
      <div style={{fontSize:11,color:G.muted,marginTop:3}}>{label}</div>
    </div>
  );
}

function Card({children,warn=false}){
  return(
    <div style={{background:G.card,border:`1px solid ${warn?G.red+"66":G.border}`,borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 6px rgba(74,144,217,0.07)",marginBottom:8}}>
      {children}
    </div>
  );
}

// ─── Field + Input ────────────────────────────────────────────────────────────
const INP = {width:"100%",background:"#f6f9ff",border:`1px solid ${G.border}`,borderRadius:10,padding:"10px 13px",color:G.text,fontSize:15,outline:"none",display:"block"};
const BTNP= {background:G.accent,color:"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontWeight:700,fontSize:14};
const BTNC= {background:"none",border:`1px solid ${G.border}`,borderRadius:10,padding:"11px 18px",color:G.muted,fontSize:14};
const IBTN= (c,bg)=>({background:bg,color:c,border:"none",borderRadius:8,width:36,height:36,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:14,cursor:"pointer",flexShrink:0});

function Field({label,children}){
  return(
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:11,color:G.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:0.8,fontFamily:"'JetBrains Mono'"}}>{label}</label>
      {children}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({title,onClose,children}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div className="fade" style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:18,padding:28,width:"100%",maxWidth:460,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(74,144,217,0.18)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{fontFamily:"'Syne'",fontSize:18,fontWeight:800}}>{title}</h3>
          <button onClick={onClose} style={IBTN(G.blue,G.blueSoft)}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── ASSINATURAS ─────────────────────────────────────────────────────────────
const EMPTY_SUB = {name:"",provider:"",cost:"",cycle:"mensal",renewal:"",status:"ativo",notes:""};

function SubsTab({data,onUpdate}){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(EMPTY_SUB);
  const [editing,setEditing]=useState(null);

  const total = data.filter(s=>s.status==="ativo").reduce((a,s)=>a+Number(s.cost||0),0);

  function openAdd(){ setForm({...EMPTY_SUB,id:uid()}); setEditing(null); setModal(true); }
  function openEdit(s){ setForm({...s}); setEditing(s.id); setModal(true); }
  function handleSave(){
    if(!form.name.trim()){ alert("Preencha o nome!"); return; }
    if(editing) onUpdate(data.map(s=>s.id===editing?{...form}:s));
    else onUpdate([...data,{...form}]);
    setModal(false);
  }
  function handleDel(id){ if(window.confirm("Excluir?")) onUpdate(data.filter(s=>s.id!==id)); }
  const upd = k => e => setForm(p=>({...p,[k]:e.target.value}));

  return(
    <div className="fade">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <h2 style={{fontFamily:"'Syne'",fontSize:20,fontWeight:800}}>Assinaturas IA</h2>
          <p style={{fontSize:12,color:G.muted,marginTop:2}}>Ativas: <strong style={{color:G.accent,fontFamily:"'JetBrains Mono'"}}>{fmtMoney(total)}/mês</strong></p>
        </div>
        <button style={BTNP} onClick={openAdd}>+ Nova</button>
      </div>

      {data.length===0 && <p style={{color:G.muted,fontSize:14,textAlign:"center",padding:40}}>Nenhuma assinatura. Clique em "+ Nova" para adicionar.</p>}

      {data.map(s=>{
        const days=daysLeft(s.renewal);
        const urgent=days!==null&&days<=7;
        return(
          <Card key={s.id} warn={urgent}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:4}}>
                  <span style={{fontFamily:"'Syne'",fontWeight:700,fontSize:15}}>{s.name}</span>
                  <Badge color={s.status==="ativo"?G.accent:G.muted}>{s.status}</Badge>
                  {urgent&&<Badge color={G.red}>⚠ {days}d</Badge>}
                </div>
                <div style={{fontSize:12,color:G.muted}}>{s.provider} · {s.cycle} · Renova: {fmtDate(s.renewal)}</div>
                <div style={{fontFamily:"'JetBrains Mono'",fontWeight:700,color:G.gold,fontSize:14,marginTop:4}}>{fmtMoney(s.cost)}</div>
                {s.notes&&<div style={{fontSize:12,color:G.dim,marginTop:3,fontStyle:"italic"}}>{s.notes}</div>}
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button style={IBTN(G.blue,G.blueSoft)} onClick={()=>openEdit(s)}>✏</button>
                <button style={IBTN(G.red,G.redSoft)} onClick={()=>handleDel(s.id)}>✕</button>
              </div>
            </div>
          </Card>
        );
      })}

      {modal&&(
        <Modal title={editing?"Editar Assinatura":"Nova Assinatura"} onClose={()=>setModal(false)}>
          <Field label="Nome *"><input style={INP} value={form.name} onChange={upd("name")} placeholder="Ex: Claude Pro" /></Field>
          <Field label="Provedor"><input style={INP} value={form.provider} onChange={upd("provider")} placeholder="Ex: Anthropic" /></Field>
          <Field label="Custo (R$)"><input style={INP} type="number" value={form.cost} onChange={upd("cost")} placeholder="99" /></Field>
          <Field label="Ciclo">
            <select style={INP} value={form.cycle} onChange={upd("cycle")}>
              <option value="mensal">Mensal</option>
              <option value="anual">Anual</option>
              <option value="semanal">Semanal</option>
            </select>
          </Field>
          <Field label="Data de Renovação"><input style={INP} type="date" value={form.renewal} onChange={upd("renewal")} /></Field>
          <Field label="Status">
            <select style={INP} value={form.status} onChange={upd("status")}>
              <option value="ativo">Ativo</option>
              <option value="pausado">Pausado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </Field>
          <Field label="Notas"><input style={INP} value={form.notes} onChange={upd("notes")} placeholder="Opcional" /></Field>
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <button style={BTNP} onClick={handleSave}>Salvar</button>
            <button style={BTNC} onClick={()=>setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── DOMÍNIOS ─────────────────────────────────────────────────────────────────
const EMPTY_DOM = {domain:"",registrar:"",cost:"",renewal:"",hosting:"",hostingCost:"",status:"ativo"};

function DomainsTab({data,onUpdate}){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(EMPTY_DOM);
  const [editing,setEditing]=useState(null);

  function openAdd(){ setForm({...EMPTY_DOM,id:uid()}); setEditing(null); setModal(true); }
  function openEdit(d){ setForm({...d}); setEditing(d.id); setModal(true); }
  function handleSave(){
    if(!form.domain.trim()){ alert("Preencha o domínio!"); return; }
    if(editing) onUpdate(data.map(d=>d.id===editing?{...form}:d));
    else onUpdate([...data,{...form}]);
    setModal(false);
  }
  function handleDel(id){ if(window.confirm("Excluir?")) onUpdate(data.filter(d=>d.id!==id)); }
  const upd = k => e => setForm(p=>({...p,[k]:e.target.value}));

  return(
    <div className="fade">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{fontFamily:"'Syne'",fontSize:20,fontWeight:800}}>Domínios & Hospedagem</h2>
        <button style={BTNP} onClick={openAdd}>+ Novo</button>
      </div>

      {data.length===0&&<p style={{color:G.muted,fontSize:14,textAlign:"center",padding:40}}>Nenhum domínio cadastrado.</p>}

      {data.map(d=>{
        const days=daysLeft(d.renewal);
        const urgent=days!==null&&days<=30;
        return(
          <Card key={d.id}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:4}}>
                  <span style={{fontFamily:"'JetBrains Mono'",fontWeight:700,fontSize:14,color:G.accent}}>🌐 {d.domain}</span>
                  <Badge color={d.status==="ativo"?G.accent:G.muted}>{d.status}</Badge>
                  {urgent&&<Badge color={G.gold}>⚠ {days}d</Badge>}
                </div>
                <div style={{fontSize:12,color:G.muted}}>{d.registrar} · Hosting: {d.hosting||"—"} · Vence: {fmtDate(d.renewal)}</div>
                <div style={{fontFamily:"'JetBrains Mono'",fontWeight:700,color:G.gold,fontSize:14,marginTop:4}}>{fmtMoney(Number(d.cost||0)+Number(d.hostingCost||0))}/ano</div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button style={IBTN(G.blue,G.blueSoft)} onClick={()=>openEdit(d)}>✏</button>
                <button style={IBTN(G.red,G.redSoft)} onClick={()=>handleDel(d.id)}>✕</button>
              </div>
            </div>
          </Card>
        );
      })}

      {modal&&(
        <Modal title={editing?"Editar Domínio":"Novo Domínio"} onClose={()=>setModal(false)}>
          <Field label="Domínio *"><input style={INP} value={form.domain} onChange={upd("domain")} placeholder="Ex: meusite.com.br" /></Field>
          <Field label="Registrador"><input style={INP} value={form.registrar} onChange={upd("registrar")} placeholder="Ex: Registro.br" /></Field>
          <Field label="Custo Domínio/ano (R$)"><input style={INP} type="number" value={form.cost} onChange={upd("cost")} /></Field>
          <Field label="Hospedagem"><input style={INP} value={form.hosting} onChange={upd("hosting")} placeholder="Ex: Vercel" /></Field>
          <Field label="Custo Hosting/mês (R$)"><input style={INP} type="number" value={form.hostingCost} onChange={upd("hostingCost")} /></Field>
          <Field label="Renovação do Domínio"><input style={INP} type="date" value={form.renewal} onChange={upd("renewal")} /></Field>
          <Field label="Status">
            <select style={INP} value={form.status} onChange={upd("status")}>
              <option value="ativo">Ativo</option>
              <option value="expirado">Expirado</option>
              <option value="transferindo">Transferindo</option>
            </select>
          </Field>
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <button style={BTNP} onClick={handleSave}>Salvar</button>
            <button style={BTNC} onClick={()=>setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── FINANÇAS ─────────────────────────────────────────────────────────────────
const EMPTY_FIN = {desc:"",amount:"",category:"",date:"",recurrent:false};

function FinancesTab({data,onUpdate}){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(EMPTY_FIN);

  const total    = data.reduce((a,d)=>a+Number(d.amount||0),0);
  const recTotal = data.filter(d=>d.recurrent).reduce((a,d)=>a+Number(d.amount||0),0);
  const oneTime  = data.filter(d=>!d.recurrent).reduce((a,d)=>a+Number(d.amount||0),0);

  function openAdd(){ setForm({...EMPTY_FIN,id:uid(),date:today()}); setModal(true); }
  function handleSave(){
    if(!form.desc.trim()){ alert("Preencha a descrição!"); return; }
    onUpdate([...data,{...form,recurrent:!!form.recurrent}]);
    setModal(false);
  }
  function handleDel(id){ if(window.confirm("Excluir?")) onUpdate(data.filter(d=>d.id!==id)); }
  const upd = k => e => setForm(p=>({...p,[k]:e.target.value}));

  return(
    <div className="fade">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{fontFamily:"'Syne'",fontSize:20,fontWeight:800}}>Finanças & Gastos</h2>
        <button style={BTNP} onClick={openAdd}>+ Gasto</button>
      </div>

      <div className="stat-grid">
        <Stat icon="💸" label="Total de gastos"   value={fmtMoney(total)}    color={G.accent} />
        <Stat icon="🔄" label="Recorrentes/mês"   value={fmtMoney(recTotal)} color={G.blue}   />
        <Stat icon="⚡" label="Pontuais"           value={fmtMoney(oneTime)}  color={G.muted}  />
      </div>

      {data.length===0&&<p style={{color:G.muted,fontSize:14,textAlign:"center",padding:30}}>Nenhum gasto cadastrado.</p>}

      {[...data].reverse().map(d=>(
        <Card key={d.id}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:3}}>
                <span style={{fontWeight:600,fontSize:14}}>💸 {d.desc}</span>
                {d.recurrent&&<Badge color={G.blue}>🔄 recorrente</Badge>}
              </div>
              <div style={{fontSize:12,color:G.muted}}>{d.category||"—"} · {fmtDate(d.date)}</div>
              <div style={{fontFamily:"'JetBrains Mono'",fontWeight:700,color:G.accent,fontSize:14,marginTop:4}}>-{fmtMoney(d.amount)}</div>
            </div>
            <button style={IBTN(G.red,G.redSoft)} onClick={()=>handleDel(d.id)}>✕</button>
          </div>
        </Card>
      ))}

      {modal&&(
        <Modal title="Novo Gasto" onClose={()=>setModal(false)}>
          <Field label="Descrição *"><input style={INP} value={form.desc} onChange={upd("desc")} placeholder="Ex: Hospedagem VPS" /></Field>
          <Field label="Valor (R$)"><input style={INP} type="number" value={form.amount} onChange={upd("amount")} placeholder="0,00" /></Field>
          <Field label="Categoria"><input style={INP} value={form.category} onChange={upd("category")} placeholder="Ex: Tecnologia" /></Field>
          <Field label="Data"><input style={INP} type="date" value={form.date} onChange={upd("date")} /></Field>
          <Field label="Recorrente?">
            <select style={INP} value={form.recurrent?"sim":"nao"} onChange={e=>setForm(p=>({...p,recurrent:e.target.value==="sim"}))}>
              <option value="nao">Não (pontual)</option>
              <option value="sim">Sim (mensal)</option>
            </select>
          </Field>
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <button style={BTNP} onClick={handleSave}>Salvar</button>
            <button style={BTNC} onClick={()=>setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── PROJETOS ─────────────────────────────────────────────────────────────────
const ST_COLOR = {"planejando":G.blue,"em andamento":G.gold,"concluído":G.accent,"pausado":G.muted,"cancelado":G.red};
const PR_COLOR = {alta:G.red,média:G.gold,baixa:G.blue};
const EMPTY_PRJ= {name:"",client:"",status:"planejando",priority:"média",deadline:"",budget:"",notes:""};

function ProjectsTab({data,onUpdate}){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(EMPTY_PRJ);
  const [editing,setEditing]=useState(null);

  function openAdd(){ setForm({...EMPTY_PRJ,id:uid()}); setEditing(null); setModal(true); }
  function openEdit(p){ setForm({...p}); setEditing(p.id); setModal(true); }
  function handleSave(){
    if(!form.name.trim()){ alert("Preencha o nome!"); return; }
    if(editing) onUpdate(data.map(p=>p.id===editing?{...form}:p));
    else onUpdate([...data,{...form}]);
    setModal(false);
  }
  function handleDel(id){ if(window.confirm("Excluir?")) onUpdate(data.filter(p=>p.id!==id)); }
  const upd = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const groups=["em andamento","planejando","pausado","concluído","cancelado"];

  return(
    <div className="fade">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{fontFamily:"'Syne'",fontSize:20,fontWeight:800}}>Projetos & Tarefas</h2>
        <button style={BTNP} onClick={openAdd}>+ Projeto</button>
      </div>

      {data.length===0&&<p style={{color:G.muted,fontSize:14,textAlign:"center",padding:40}}>Nenhum projeto cadastrado.</p>}

      {groups.map(g=>{
        const items=data.filter(p=>p.status===g);
        if(!items.length) return null;
        return(
          <div key={g} style={{marginBottom:22}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:ST_COLOR[g]}}/>
              <span style={{fontFamily:"'Syne'",fontWeight:800,fontSize:12,color:ST_COLOR[g],textTransform:"uppercase",letterSpacing:1}}>{g}</span>
              <span style={{color:G.dim,fontSize:12}}>({items.length})</span>
            </div>
            {items.map(p=>{
              const days=daysLeft(p.deadline);
              const hot=days!==null&&days<=7&&days>=0;
              return(
                <Card key={p.id}>
                  <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:4}}>
                        <span style={{fontFamily:"'Syne'",fontWeight:700,fontSize:15}}>{p.name}</span>
                        <Badge color={PR_COLOR[p.priority]}>{p.priority}</Badge>
                        {hot&&<Badge color={G.red}>🔥 {days}d</Badge>}
                      </div>
                      <div style={{fontSize:12,color:G.muted}}>
                        {p.client||"—"} · Prazo: {fmtDate(p.deadline)}{p.budget>0?` · ${fmtMoney(p.budget)}`:""}
                      </div>
                      {p.notes&&<div style={{fontSize:12,color:G.dim,marginTop:3,fontStyle:"italic"}}>{p.notes}</div>}
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button style={IBTN(G.blue,G.blueSoft)} onClick={()=>openEdit(p)}>✏</button>
                      <button style={IBTN(G.red,G.redSoft)} onClick={()=>handleDel(p.id)}>✕</button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        );
      })}

      {modal&&(
        <Modal title={editing?"Editar Projeto":"Novo Projeto"} onClose={()=>setModal(false)}>
          <Field label="Nome *"><input style={INP} value={form.name} onChange={upd("name")} placeholder="Ex: Site Portfolio" /></Field>
          <Field label="Cliente"><input style={INP} value={form.client} onChange={upd("client")} placeholder="Ex: Interno" /></Field>
          <Field label="Status">
            <select style={INP} value={form.status} onChange={upd("status")}>
              {["planejando","em andamento","pausado","concluído","cancelado"].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Prioridade">
            <select style={INP} value={form.priority} onChange={upd("priority")}>
              <option value="alta">Alta</option>
              <option value="média">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </Field>
          <Field label="Prazo"><input style={INP} type="date" value={form.deadline} onChange={upd("deadline")} /></Field>
          <Field label="Budget (R$)"><input style={INP} type="number" value={form.budget} onChange={upd("budget")} /></Field>
          <Field label="Notas"><textarea style={{...INP,resize:"vertical",minHeight:70}} value={form.notes} onChange={upd("notes")} /></Field>
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <button style={BTNP} onClick={handleSave}>Salvar</button>
            <button style={BTNC} onClick={()=>setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── VISÃO GERAL ──────────────────────────────────────────────────────────────
function OverviewTab({subs,domains,finances,projects}){
  const aiTotal   = subs.filter(s=>s.status==="ativo").reduce((a,s)=>a+Number(s.cost||0),0);
  const gastos    = finances.reduce((a,f)=>a+Number(f.amount||0),0);
  const recorrente= finances.filter(f=>f.recurrent).reduce((a,f)=>a+Number(f.amount||0),0);
  const ativos    = projects.filter(p=>p.status==="em andamento");

  const renewals=[
    ...subs.map(s=>({name:s.name,date:s.renewal,type:"IA"})),
    ...domains.map(d=>({name:d.domain,date:d.renewal,type:"Domínio"})),
  ].filter(r=>r.date).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,6);

  return(
    <div className="fade">
      <h2 style={{fontFamily:"'Syne'",fontSize:20,fontWeight:800,marginBottom:16}}>Visão Geral</h2>

      <div className="stat-grid">
        <Stat icon="🤖" label="Assinaturas IA/mês" value={fmtMoney(aiTotal)}    color={G.accent}/>
        <Stat icon="💸" label="Total gastos"        value={fmtMoney(gastos)}     color={G.red}   />
        <Stat icon="🔄" label="Recorrentes"         value={fmtMoney(recorrente)} color={G.blue}  />
        <Stat icon="🚀" label="Projetos ativos"     value={ativos.length}        color={G.accent}/>
        <Stat icon="🌐" label="Domínios"            value={domains.length}       color={G.blue}  />
      </div>

      <div className="two-col">
        <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:14,padding:18,boxShadow:"0 2px 10px rgba(74,144,217,0.08)"}}>
          <h3 style={{fontFamily:"'Syne'",fontWeight:800,fontSize:13,marginBottom:14,color:G.gold}}>📅 Próximas Renovações</h3>
          {renewals.length===0&&<p style={{color:G.muted,fontSize:13}}>Nenhuma cadastrada.</p>}
          {renewals.map((r,i)=>{
            const days=daysLeft(r.date);
            const color=days!==null&&days<=7?G.red:days!==null&&days<=30?G.gold:G.muted;
            return(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<renewals.length-1?`1px solid ${G.border}`:"none"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{r.name}</div>
                  <div style={{fontSize:11,color:G.muted}}>{r.type} · {fmtDate(r.date)}</div>
                </div>
                <span style={{fontFamily:"'JetBrains Mono'",fontSize:12,color,fontWeight:700}}>
                  {days!==null?(days<0?"Vencido!":`${days}d`):"—"}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:14,padding:18,boxShadow:"0 2px 10px rgba(74,144,217,0.08)"}}>
          <h3 style={{fontFamily:"'Syne'",fontWeight:800,fontSize:13,marginBottom:14,color:G.accent}}>🔥 Em Andamento</h3>
          {ativos.length===0&&<p style={{color:G.muted,fontSize:13}}>Nenhum projeto ativo.</p>}
          {ativos.map((p,i)=>{
            const days=daysLeft(p.deadline);
            return(
              <div key={p.id} style={{padding:"8px 0",borderBottom:i<ativos.length-1?`1px solid ${G.border}`:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:600}}>{p.name}</span>
                  <Badge color={PR_COLOR[p.priority]}>{p.priority}</Badge>
                </div>
                <div style={{fontSize:11,color:days!==null&&days<=7?G.red:G.muted,marginTop:2}}>
                  {p.client} · {fmtDate(p.deadline)}{days!==null?` (${days}d)`:""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── LOCK SCREEN ─────────────────────────────────────────────────────────────
function LockScreen({onUnlock}){
  const [pin,setPin]=useState("");
  const [err,setErr]=useState(false);
  const tryPin=()=>{
    if(pin==="2025") onUnlock();
    else { setErr(true); setPin(""); setTimeout(()=>setErr(false),1200); }
  };
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div className="fade" style={{textAlign:"center",width:"100%",maxWidth:340}}>
        <div style={{fontSize:54,marginBottom:14,animation:"glow 3s infinite",display:"inline-block"}}>🔐</div>
        <div style={{fontFamily:"'Syne'",fontSize:28,fontWeight:800,color:G.text,marginBottom:4}}>Meu Painel</div>
        <div style={{color:G.muted,fontSize:13,marginBottom:28,fontFamily:"'JetBrains Mono'"}}>acesso privado</div>
        <div style={{background:G.card,border:`2px solid ${err?G.red:G.border}`,borderRadius:16,padding:"26px 24px",transition:"border .3s",boxShadow:"0 8px 32px rgba(74,144,217,0.14)"}}>
          <input
            type="password" inputMode="numeric" maxLength={6}
            value={pin} onChange={e=>setPin(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&tryPin()}
            placeholder="PIN" autoFocus
            style={{...INP,textAlign:"center",fontSize:26,letterSpacing:10,marginBottom:12}}
          />
          {err&&<div style={{color:G.red,fontSize:12,marginBottom:10}}>PIN incorreto. Tente novamente.</div>}
          <button style={{...BTNP,width:"100%",fontSize:16,padding:"13px",animation:"glow 3s infinite"}} onClick={tryPin}>
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS=[
  {id:"overview", label:"Início",   icon:"◈"},
  {id:"subs",     label:"IA",       icon:"🤖"},
  {id:"domains",  label:"Domínios", icon:"🌐"},
  {id:"finances", label:"Finanças", icon:"💰"},
  {id:"projects", label:"Projetos", icon:"🚀"},
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [unlocked,setUnlocked]=useState(false);
  const [tab,setTab]=useState("overview");
  const [loading,setLoading]=useState(true);
  const [data,setData]=useState({subs:[],domains:[],finances:[],projects:[]});
  const [mob,setMob]=useState(window.innerWidth<=640);

  useEffect(()=>{
    const fn=()=>setMob(window.innerWidth<=640);
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[]);

  useEffect(()=>{
    const s=LS.get("mp_subs");
    const d=LS.get("mp_domains");
    const f=LS.get("mp_finances");
    const p=LS.get("mp_projects");
    setData({subs:s||SEED.subs,domains:d||SEED.domains,finances:f||SEED.finances,projects:p||SEED.projects});
    setLoading(false);
  },[]);

  const update=useCallback((key)=>(val)=>{
    setData(prev=>({...prev,[key]:val}));
    LS.set("mp_"+key,val);
  },[]);

  if(!unlocked) return <><style>{GLOBAL_CSS}</style><LockScreen onUnlock={()=>setUnlocked(true)}/></>;
  if(loading)   return <><style>{GLOBAL_CSS}</style><div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:G.muted}}>Carregando...</div></>;

  return(
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>

        {/* Header */}
        <header style={{background:G.surface,borderBottom:`1px solid ${G.border}`,padding:mob?"0 14px":"0 24px",display:"flex",alignItems:"center",height:mob?52:58,position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 14px rgba(74,144,217,0.08)"}}>
          <div style={{fontFamily:"'Syne'",fontWeight:800,fontSize:mob?16:18,color:G.accent,flex:1,display:"flex",alignItems:"center",gap:8}}>
            <span style={{animation:"glow 3s infinite",display:"inline-block"}}>◈</span> Meu Painel
          </div>
          {!mob&&(
            <nav style={{display:"flex",gap:4}}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{
                  background:tab===t.id?G.accentSoft:"none",
                  color:tab===t.id?G.accent:G.muted,
                  border:tab===t.id?`1px solid ${G.accent}55`:"1px solid transparent",
                  borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,
                  display:"flex",alignItems:"center",gap:5,transition:"all .2s"
                }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </nav>
          )}
          <button onClick={()=>setUnlocked(false)} style={{background:"none",border:"none",color:G.muted,fontSize:18,marginLeft:mob?8:16}} title="Sair">🔒</button>
        </header>

        {/* Content */}
        <main style={{flex:1,padding:mob?"16px 12px 90px":"26px 28px 56px",maxWidth:1100,width:"100%",margin:"0 auto"}}>
          {tab==="overview"&&<OverviewTab subs={data.subs} domains={data.domains} finances={data.finances} projects={data.projects}/>}
          {tab==="subs"    &&<SubsTab     data={data.subs}     onUpdate={update("subs")}/>}
          {tab==="domains" &&<DomainsTab  data={data.domains}  onUpdate={update("domains")}/>}
          {tab==="finances"&&<FinancesTab data={data.finances} onUpdate={update("finances")}/>}
          {tab==="projects"&&<ProjectsTab data={data.projects} onUpdate={update("projects")}/>}
        </main>

        {/* Bottom nav mobile */}
        {mob&&(
          <nav style={{position:"fixed",bottom:0,left:0,right:0,background:G.surface,borderTop:`1px solid ${G.border}`,display:"flex",zIndex:50,boxShadow:"0 -4px 20px rgba(74,144,217,0.10)",paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:"none",border:"none",color:tab===t.id?G.accent:G.muted,padding:"10px 4px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"color .15s"}}>
                <span style={{fontSize:20}}>{t.icon}</span>
                <span style={{fontSize:10,fontWeight:tab===t.id?700:400}}>{t.label}</span>
                {tab===t.id&&<div style={{width:20,height:3,background:G.accent,borderRadius:2,marginTop:1}}/>}
              </button>
            ))}
          </nav>
        )}

        {/* Footer desktop */}
        {!mob&&(
          <footer style={{borderTop:`1px solid ${G.border}`,padding:"10px 28px",display:"flex",justifyContent:"space-between"}}>
            <span style={{color:G.dim,fontSize:11,fontFamily:"'JetBrains Mono'"}}>painel privado · dados salvos no navegador</span>
            <span style={{color:G.dim,fontSize:11}}>{new Date().toLocaleDateString("pt-BR")}</span>
          </footer>
        )}
      </div>
    </>
  );
}