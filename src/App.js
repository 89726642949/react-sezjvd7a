import React from "react";import { useState, useEffect, useCallback } from "react";

// ─── Palette ─────────────────────────────────────────────────────────────────
const G = {
  bg: "#f0f5ff",
  surface: "#ffffff",
  card: "#ffffff",
  border: "#dce7f8",
  accent: "#ff8c42",
  accentSoft: "rgba(255,140,66,0.13)",
  gold: "#ff6b1a",
  red: "#e05c2a",
  redSoft: "rgba(224,92,42,0.12)",
  blue: "#4a90d9",
  blueSoft: "rgba(74,144,217,0.12)",
  text: "#1a2a4a",
  muted: "#7a90b8",
  dim: "#b0c4de",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    background: linear-gradient(135deg, #f0f5ff 0%, #fff4ee 100%);
    background-attachment: fixed;
    color: ${G.text};
    font-family: 'DM Sans', sans-serif;
    -webkit-tap-highlight-color: transparent;
  }
  input, textarea, select { font-family: 'DM Sans', sans-serif; font-size: 16px; }
  button { cursor: pointer; font-family: 'DM Sans', sans-serif; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: ${G.dim}; border-radius: 4px; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes glow { 0%,100% { box-shadow: 0 0 10px ${G.accent}55; } 50% { box-shadow: 0 0 22px ${G.accent}99; } }
  .fade-in { animation: fadeIn 0.3s ease both; }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-bottom: 20px; }
  .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .row-wrap { display: flex; align-items: center; gap: 12px; }
  @media (max-width: 600px) {
    .overview-grid { grid-template-columns: 1fr; }
    .stat-grid { grid-template-columns: 1fr 1fr; }
    .row-wrap { flex-wrap: wrap; }
    .item-actions { width: 100%; display: flex; justify-content: flex-end; gap: 8px; }
  }
`;

// ─── Utils ───────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const daysUntil = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;
const fmtDate = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—";
const fmtMoney = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const uid = () => Math.random().toString(36).slice(2, 9);

function useIsMobile() {
  const [mob, setMob] = useState(window.innerWidth <= 600);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth <= 600);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mob;
}

// ─── Storage ─────────────────────────────────────────────────────────────────
const KEYS = { subs: "ms2_subs", domains: "ms2_domains", finances: "ms2_finances", projects: "ms2_projects" };
async function load(key) {
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; }
}
async function save(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)); } catch {}
}

// ─── Seed ────────────────────────────────────────────────────────────────────
const SEED = {
  subs: [
    { id: uid(), name: "Claude Pro", provider: "Anthropic", cost: 99, cycle: "mensal", renewal: "2025-03-15", status: "ativo" },
    { id: uid(), name: "ChatGPT Plus", provider: "OpenAI", cost: 99, cycle: "mensal", renewal: "2025-03-20", status: "ativo" },
    { id: uid(), name: "Midjourney", provider: "Midjourney", cost: 52, cycle: "mensal", renewal: "2025-03-10", status: "ativo" },
    { id: uid(), name: "Notion AI", provider: "Notion", cost: 45, cycle: "mensal", renewal: "2025-04-01", status: "pausado" },
  ],
  domains: [
    { id: uid(), domain: "silmara.dev", registrar: "Registro.br", cost: 39.90, renewal: "2025-11-20", hosting: "Vercel", hostingCost: 0, status: "ativo" },
    { id: uid(), domain: "meusite.com.br", registrar: "HostGator", cost: 49.90, renewal: "2025-06-05", hosting: "HostGator", hostingCost: 25.90, status: "ativo" },
  ],
  finances: [
    { id: uid(), desc: "Assinaturas IA", amount: 295, category: "Tecnologia", date: today(), recurrent: true },
    { id: uid(), desc: "Hospedagem mensal", amount: 25.90, category: "Infraestrutura", date: today(), recurrent: true },
  ],
  projects: [
    { id: uid(), name: "App Painel Pessoal", client: "Interno", status: "em andamento", priority: "alta", deadline: "2025-03-30", budget: 0, notes: "Dashboard de controle" },
    { id: uid(), name: "Site Portfolio", client: "Interno", status: "planejando", priority: "média", deadline: "2025-04-15", budget: 500, notes: "Novo portfolio 2025" },
    { id: uid(), name: "Automação N8N", client: "Cliente B", status: "concluído", priority: "alta", deadline: "2025-02-28", budget: 2000, notes: "Fluxo de onboarding" },
  ],
};

// ─── UI Primitives ────────────────────────────────────────────────────────────
function Badge({ children, color = G.accent }) {
  return (
    <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", fontFamily: "'JetBrains Mono'" }}>
      {children}
    </span>
  );
}

function StatCard({ label, value, color = G.accent, icon }) {
  return (
    <div className="fade-in" style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: "16px", position: "relative", overflow: "hidden", boxShadow: "0 2px 12px rgba(74,144,217,0.09)" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 16, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11, color: G.muted, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  const mob = useIsMobile();
  if (mob) {
    return (
      <div style={{ position: "fixed", inset: 0, background: G.surface, zIndex: 200, overflowY: "auto", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Syne'", fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: G.blueSoft, border: "none", color: G.blue, fontSize: 18, width: 38, height: 38, borderRadius: 10 }}>✕</button>
        </div>
        {children}
      </div>
    );
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div className="fade-in" style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 18, padding: 28, width: "100%", maxWidth: 460, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(74,144,217,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Syne'", fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: G.blueSoft, border: "none", color: G.blue, fontSize: 18, width: 38, height: 38, borderRadius: 10 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, color: G.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "'JetBrains Mono'" }}>{label}</label>
      {children}
    </div>
  );
}

const inp = { width: "100%", background: "#f6f9ff", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 13px", color: G.text, fontSize: 15, outline: "none" };
const btnP = { background: G.accent, color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 700, fontSize: 14 };
const btnCancel = { background: "none", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 18px", color: G.muted, fontSize: 14 };
const iconBtn = (color, bg) => ({ background: bg, color, border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 });

function RowCard({ urgent, children, actions }) {
  return (
    <div style={{ background: G.card, border: `1px solid ${urgent ? G.red + "66" : G.border}`, borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 6px rgba(74,144,217,0.07)", marginBottom: 8 }}>
      <div className="row-wrap">
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        <div className="item-actions" style={{ display: "flex", gap: 8, flexShrink: 0 }}>{actions}</div>
      </div>
    </div>
  );
}

// ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
function SubsTab({ data, onUpdate }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const fld = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const openAdd = () => { setForm({ id: uid(), status: "ativo", cycle: "mensal" }); setModal(true); };
  const openEdit = (item) => { setForm({ ...item, _e: true }); setModal(true); };
  const save_ = () => {
    if (!form.name) return;
    const clean = { ...form }; delete clean._e;
    form._e ? onUpdate(data.map(d => d.id === form.id ? clean : d)) : onUpdate([...data, clean]);
    setModal(false);
  };
  const del = (id) => onUpdate(data.filter(d => d.id !== id));
  const total = data.filter(d => d.status === "ativo").reduce((s, d) => s + Number(d.cost || 0), 0);

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: "'Syne'", fontSize: 19, fontWeight: 800 }}>Assinaturas IA</h2>
          <p style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>Ativas: <strong style={{ color: G.accent, fontFamily: "'JetBrains Mono'" }}>{fmtMoney(total)}/mês</strong></p>
        </div>
        <button style={btnP} onClick={openAdd}>+ Nova</button>
      </div>

      {data.map(s => {
        const days = daysUntil(s.renewal);
        const urgent = days !== null && days <= 7;
        return (
          <RowCard key={s.id} urgent={urgent} actions={<>
            <button style={iconBtn(G.blue, G.blueSoft)} onClick={() => openEdit(s)}>✏</button>
            <button style={iconBtn(G.red, G.redSoft)} onClick={() => del(s.id)}>✕</button>
          </>}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 14 }}>{s.name}</span>
              <Badge color={s.status === "ativo" ? G.accent : G.muted}>{s.status}</Badge>
              {urgent && <Badge color={G.red}>⚠ {days}d</Badge>}
            </div>
            <div style={{ fontSize: 12, color: G.muted }}>{s.provider} · {s.cycle} · {fmtDate(s.renewal)}</div>
            <div style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: G.gold, fontSize: 13, marginTop: 4 }}>{fmtMoney(s.cost)}</div>
          </RowCard>
        );
      })}

      {modal && (
        <Modal title={form._e ? "Editar Assinatura" : "Nova Assinatura"} onClose={() => setModal(false)}>
          <Field label="Nome"><input style={inp} value={form.name || ""} onChange={fld("name")} placeholder="Ex: Claude Pro" /></Field>
          <Field label="Provedor"><input style={inp} value={form.provider || ""} onChange={fld("provider")} placeholder="Ex: Anthropic" /></Field>
          <Field label="Custo (R$)"><input style={inp} type="number" value={form.cost || ""} onChange={fld("cost")} /></Field>
          <Field label="Ciclo">
            <select style={inp} value={form.cycle || "mensal"} onChange={fld("cycle")}>
              <option value="mensal">Mensal</option><option value="anual">Anual</option><option value="semanal">Semanal</option>
            </select>
          </Field>
          <Field label="Renovação"><input style={inp} type="date" value={form.renewal || ""} onChange={fld("renewal")} /></Field>
          <Field label="Status">
            <select style={inp} value={form.status || "ativo"} onChange={fld("status")}>
              <option value="ativo">Ativo</option><option value="pausado">Pausado</option><option value="cancelado">Cancelado</option>
            </select>
          </Field>
          <Field label="Notas"><input style={inp} value={form.notes || ""} onChange={fld("notes")} /></Field>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button style={btnP} onClick={save_}>Salvar</button>
            <button style={btnCancel} onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── DOMAINS ─────────────────────────────────────────────────────────────────
function DomainsTab({ data, onUpdate }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const fld = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const openEdit = (item) => { setForm({ ...item, _e: true }); setModal(true); };
  const save_ = () => {
    if (!form.domain) return;
    const clean = { ...form }; delete clean._e;
    form._e ? onUpdate(data.map(d => d.id === form.id ? clean : d)) : onUpdate([...data, clean]);
    setModal(false);
  };
  const del = (id) => onUpdate(data.filter(d => d.id !== id));

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Syne'", fontSize: 19, fontWeight: 800 }}>Domínios & Hospedagem</h2>
        <button style={btnP} onClick={() => { setForm({ id: uid(), status: "ativo" }); setModal(true); }}>+ Novo</button>
      </div>

      {data.map(d => {
        const days = daysUntil(d.renewal);
        const urgent = days !== null && days <= 30;
        return (
          <RowCard key={d.id} urgent={false} actions={<>
            <button style={iconBtn(G.blue, G.blueSoft)} onClick={() => openEdit(d)}>✏</button>
            <button style={iconBtn(G.red, G.redSoft)} onClick={() => del(d.id)}>✕</button>
          </>}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, fontSize: 14, color: G.accent }}>🌐 {d.domain}</span>
              <Badge color={d.status === "ativo" ? G.accent : G.muted}>{d.status}</Badge>
              {urgent && <Badge color={G.gold}>⚠ {days}d</Badge>}
            </div>
            <div style={{ fontSize: 12, color: G.muted }}>{d.registrar} · {d.hosting || "—"} · {fmtDate(d.renewal)}</div>
            <div style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: G.gold, fontSize: 13, marginTop: 4 }}>{fmtMoney(Number(d.cost || 0) + Number(d.hostingCost || 0))}/ano</div>
          </RowCard>
        );
      })}

      {modal && (
        <Modal title={form._e ? "Editar Domínio" : "Novo Domínio"} onClose={() => setModal(false)}>
          <Field label="Domínio"><input style={inp} value={form.domain || ""} onChange={fld("domain")} placeholder="Ex: meusite.com.br" /></Field>
          <Field label="Registrador"><input style={inp} value={form.registrar || ""} onChange={fld("registrar")} placeholder="Ex: Registro.br" /></Field>
          <Field label="Custo Domínio/ano (R$)"><input style={inp} type="number" value={form.cost || ""} onChange={fld("cost")} /></Field>
          <Field label="Hospedagem"><input style={inp} value={form.hosting || ""} onChange={fld("hosting")} placeholder="Ex: Vercel" /></Field>
          <Field label="Custo Hosting/mês (R$)"><input style={inp} type="number" value={form.hostingCost || ""} onChange={fld("hostingCost")} /></Field>
          <Field label="Renovação"><input style={inp} type="date" value={form.renewal || ""} onChange={fld("renewal")} /></Field>
          <Field label="Status">
            <select style={inp} value={form.status || "ativo"} onChange={fld("status")}>
              <option value="ativo">Ativo</option><option value="expirado">Expirado</option><option value="transferindo">Transferindo</option>
            </select>
          </Field>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button style={btnP} onClick={save_}>Salvar</button>
            <button style={btnCancel} onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── FINANCES ────────────────────────────────────────────────────────────────
function FinancesTab({ data, onUpdate }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const fld = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const total = data.reduce((s, d) => s + Number(d.amount || 0), 0);
  const recurrent = data.filter(d => d.recurrent).reduce((s, d) => s + Number(d.amount || 0), 0);
  const oneTime = data.filter(d => !d.recurrent).reduce((s, d) => s + Number(d.amount || 0), 0);
  const save_ = () => { if (!form.desc) return; onUpdate([...data, { ...form, id: uid() }]); setModal(false); };
  const del = (id) => onUpdate(data.filter(d => d.id !== id));

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Syne'", fontSize: 19, fontWeight: 800 }}>Finanças & Gastos</h2>
        <button style={btnP} onClick={() => { setForm({ date: today(), recurrent: false }); setModal(true); }}>+ Gasto</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total de gastos" value={fmtMoney(total)} color={G.accent} icon="💸" />
        <StatCard label="Recorrentes/mês" value={fmtMoney(recurrent)} color={G.blue} icon="🔄" />
        <StatCard label="Pontuais" value={fmtMoney(oneTime)} color={G.muted} icon="⚡" />
      </div>

      {[...data].reverse().map(d => (
        <RowCard key={d.id} actions={<button style={iconBtn(G.red, G.redSoft)} onClick={() => del(d.id)}>✕</button>}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>💸 {d.desc}</span>
            {d.recurrent && <Badge color={G.blue}>🔄</Badge>}
          </div>
          <div style={{ fontSize: 12, color: G.muted }}>{d.category} · {fmtDate(d.date)}</div>
          <div style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: G.accent, fontSize: 13, marginTop: 4 }}>-{fmtMoney(d.amount)}</div>
        </RowCard>
      ))}

      {modal && (
        <Modal title="Novo Gasto" onClose={() => setModal(false)}>
          <Field label="Descrição"><input style={inp} value={form.desc || ""} onChange={fld("desc")} placeholder="Ex: VPS mensal" /></Field>
          <Field label="Valor (R$)"><input style={inp} type="number" value={form.amount || ""} onChange={fld("amount")} /></Field>
          <Field label="Categoria"><input style={inp} value={form.category || ""} onChange={fld("category")} placeholder="Ex: Tecnologia" /></Field>
          <Field label="Data"><input style={inp} type="date" value={form.date || today()} onChange={fld("date")} /></Field>
          <Field label="Recorrente?">
            <select style={inp} value={form.recurrent ? "sim" : "nao"} onChange={e => setForm(p => ({ ...p, recurrent: e.target.value === "sim" }))}>
              <option value="nao">Não (pontual)</option>
              <option value="sim">Sim (mensal)</option>
            </select>
          </Field>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button style={btnP} onClick={save_}>Salvar</button>
            <button style={btnCancel} onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── PROJECTS ────────────────────────────────────────────────────────────────
const ST_COLOR = { "planejando": G.blue, "em andamento": G.gold, "concluído": G.accent, "pausado": G.muted, "cancelado": G.red };
const PR_COLOR = { alta: G.red, média: G.gold, baixa: G.blue };

function ProjectsTab({ data, onUpdate }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const fld = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const openEdit = (item) => { setForm({ ...item, _e: true }); setModal(true); };
  const save_ = () => {
    if (!form.name) return;
    const clean = { ...form }; delete clean._e;
    form._e ? onUpdate(data.map(d => d.id === form.id ? clean : d)) : onUpdate([...data, { ...clean, id: uid() }]);
    setModal(false);
  };
  const del = (id) => onUpdate(data.filter(d => d.id !== id));
  const groups = ["em andamento", "planejando", "pausado", "concluído", "cancelado"];

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Syne'", fontSize: 19, fontWeight: 800 }}>Projetos & Tarefas</h2>
        <button style={btnP} onClick={() => { setForm({ status: "planejando", priority: "média" }); setModal(true); }}>+ Projeto</button>
      </div>

      {groups.map(g => {
        const items = data.filter(d => d.status === g);
        if (!items.length) return null;
        return (
          <div key={g} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: ST_COLOR[g] }} />
              <span style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 12, color: ST_COLOR[g], textTransform: "uppercase", letterSpacing: 1 }}>{g}</span>
              <span style={{ color: G.dim, fontSize: 12 }}>({items.length})</span>
            </div>
            {items.map(p => {
              const days = daysUntil(p.deadline);
              return (
                <RowCard key={p.id} actions={<>
                  <button style={iconBtn(G.blue, G.blueSoft)} onClick={() => openEdit(p)}>✏</button>
                  <button style={iconBtn(G.red, G.redSoft)} onClick={() => del(p.id)}>✕</button>
                </>}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 14 }}>{p.name}</span>
                    <Badge color={PR_COLOR[p.priority]}>{p.priority}</Badge>
                    {days !== null && days <= 7 && days >= 0 && <Badge color={G.red}>🔥 {days}d</Badge>}
                  </div>
                  <div style={{ fontSize: 12, color: G.muted }}>{p.client} · {fmtDate(p.deadline)}{p.budget > 0 ? ` · ${fmtMoney(p.budget)}` : ""}</div>
                  {p.notes && <div style={{ fontSize: 12, color: G.dim, marginTop: 3, fontStyle: "italic" }}>{p.notes}</div>}
                </RowCard>
              );
            })}
          </div>
        );
      })}

      {modal && (
        <Modal title={form._e ? "Editar Projeto" : "Novo Projeto"} onClose={() => setModal(false)}>
          <Field label="Nome"><input style={inp} value={form.name || ""} onChange={fld("name")} /></Field>
          <Field label="Cliente"><input style={inp} value={form.client || ""} onChange={fld("client")} placeholder="Ex: Interno" /></Field>
          <Field label="Status">
            <select style={inp} value={form.status || "planejando"} onChange={fld("status")}>
              {["planejando", "em andamento", "pausado", "concluído", "cancelado"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Prioridade">
            <select style={inp} value={form.priority || "média"} onChange={fld("priority")}>
              <option value="alta">Alta</option><option value="média">Média</option><option value="baixa">Baixa</option>
            </select>
          </Field>
          <Field label="Prazo"><input style={inp} type="date" value={form.deadline || ""} onChange={fld("deadline")} /></Field>
          <Field label="Budget (R$)"><input style={inp} type="number" value={form.budget || ""} onChange={fld("budget")} /></Field>
          <Field label="Notas"><textarea style={{ ...inp, resize: "vertical", minHeight: 70 }} value={form.notes || ""} onChange={fld("notes")} /></Field>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button style={btnP} onClick={save_}>Salvar</button>
            <button style={btnCancel} onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── OVERVIEW ────────────────────────────────────────────────────────────────
function OverviewTab({ subs, domains, finances, projects }) {
  const monthlyAI = subs.filter(s => s.status === "ativo").reduce((a, s) => a + Number(s.cost || 0), 0);
  const totalGastos = finances.reduce((a, f) => a + Number(f.amount || 0), 0);
  const gastoRec = finances.filter(f => f.recurrent).reduce((a, f) => a + Number(f.amount || 0), 0);
  const activeProjects = projects.filter(p => p.status === "em andamento");

  const allRenewals = [
    ...subs.map(s => ({ name: s.name, date: s.renewal, type: "IA" })),
    ...domains.map(d => ({ name: d.domain, date: d.renewal, type: "Domínio" })),
  ].filter(r => r.date).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);

  return (
    <div className="fade-in">
      <h2 style={{ fontFamily: "'Syne'", fontSize: 19, fontWeight: 800, marginBottom: 16 }}>Visão Geral</h2>

      <div className="stat-grid">
        <StatCard label="Assinaturas IA/mês" value={fmtMoney(monthlyAI)} color={G.accent} icon="🤖" />
        <StatCard label="Total gastos" value={fmtMoney(totalGastos)} color={G.red} icon="💸" />
        <StatCard label="Recorrentes" value={fmtMoney(gastoRec)} color={G.blue} icon="🔄" />
        <StatCard label="Projetos ativos" value={activeProjects.length} color={G.accent} icon="🚀" />
        <StatCard label="Domínios" value={domains.length} color={G.blue} icon="🌐" />
      </div>

      <div className="overview-grid">
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: 18, boxShadow: "0 2px 12px rgba(74,144,217,0.09)" }}>
          <h3 style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 13, marginBottom: 14, color: G.gold }}>📅 Próximas Renovações</h3>
          {allRenewals.length === 0 && <p style={{ color: G.muted, fontSize: 13 }}>Nenhuma cadastrada</p>}
          {allRenewals.map((r, i) => {
            const days = daysUntil(r.date);
            const color = days !== null && days <= 7 ? G.red : days !== null && days <= 30 ? G.gold : G.muted;
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < allRenewals.length - 1 ? `1px solid ${G.border}` : "none" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: G.muted }}>{r.type} · {fmtDate(r.date)}</div>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color, fontWeight: 700 }}>
                  {days !== null ? (days < 0 ? "Vencido!" : `${days}d`) : "—"}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: 18, boxShadow: "0 2px 12px rgba(74,144,217,0.09)" }}>
          <h3 style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 13, marginBottom: 14, color: G.accent }}>🔥 Em Andamento</h3>
          {activeProjects.length === 0 && <p style={{ color: G.muted, fontSize: 13 }}>Nenhum projeto ativo</p>}
          {activeProjects.map((p, i) => {
            const days = daysUntil(p.deadline);
            return (
              <div key={p.id} style={{ padding: "8px 0", borderBottom: i < activeProjects.length - 1 ? `1px solid ${G.border}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <Badge color={PR_COLOR[p.priority]}>{p.priority}</Badge>
                </div>
                <div style={{ fontSize: 11, color: days !== null && days <= 7 ? G.red : G.muted, marginTop: 2 }}>
                  {p.client} · {fmtDate(p.deadline)}{days !== null ? ` (${days}d)` : ""}
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
function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const try_ = () => {
    if (pin === "2025") onUnlock();
    else { setError(true); setPin(""); setTimeout(() => setError(false), 1200); }
  };
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f5ff 0%, #fff4ee 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="fade-in" style={{ textAlign: "center", width: "100%", maxWidth: 340 }}>
        <div style={{ fontSize: 52, marginBottom: 12, animation: "glow 3s infinite" }}>🔐</div>
        <div style={{ fontFamily: "'Syne'", fontSize: 28, fontWeight: 800, color: G.text, marginBottom: 4 }}>Meu Painel</div>
        <div style={{ color: G.muted, fontSize: 13, marginBottom: 28, fontFamily: "'JetBrains Mono'" }}>acesso privado · PIN: 2025</div>
        <div style={{ background: G.card, border: `2px solid ${error ? G.red : G.border}`, borderRadius: 16, padding: "26px 22px", transition: "border 0.3s", boxShadow: "0 8px 32px rgba(74,144,217,0.14)" }}>
          <input
            type="password" inputMode="numeric" maxLength={6}
            value={pin} onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === "Enter" && try_()}
            placeholder="PIN" autoFocus
            style={{ ...inp, textAlign: "center", fontSize: 26, letterSpacing: 10, marginBottom: 12 }}
          />
          {error && <div style={{ color: G.red, fontSize: 12, marginBottom: 10 }}>PIN incorreto</div>}
          <button style={{ ...btnP, width: "100%", fontSize: 16, padding: "13px", animation: "glow 3s infinite" }} onClick={try_}>Entrar</button>
        </div>
      </div>
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Início", icon: "◈" },
  { id: "subs", label: "IA", icon: "🤖" },
  { id: "domains", label: "Domínios", icon: "🌐" },
  { id: "finances", label: "Finanças", icon: "💰" },
  { id: "projects", label: "Projetos", icon: "🚀" },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ subs: [], domains: [], finances: [], projects: [] });
  const mob = useIsMobile();

  useEffect(() => {
    async function init() {
      const [s, d, f, p] = await Promise.all([load(KEYS.subs), load(KEYS.domains), load(KEYS.finances), load(KEYS.projects)]);
      setData({ subs: s || SEED.subs, domains: d || SEED.domains, finances: f || SEED.finances, projects: p || SEED.projects });
      setLoading(false);
    }
    init();
  }, []);

  const update = useCallback((key) => async (val) => {
    setData(prev => ({ ...prev, [key]: val }));
    await save(KEYS[key], val);
  }, []);

  if (!unlocked) return <><style>{css}</style><LockScreen onUnlock={() => setUnlocked(true)} /></>;
  if (loading) return <><style>{css}</style><div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: G.muted }}>Carregando...</div></>;

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <header style={{
          background: G.surface, borderBottom: `1px solid ${G.border}`,
          padding: mob ? "0 14px" : "0 24px",
          display: "flex", alignItems: "center",
          height: mob ? 52 : 58,
          position: "sticky", top: 0, zIndex: 50,
          boxShadow: "0 2px 16px rgba(74,144,217,0.07)"
        }}>
          <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: mob ? 16 : 18, color: G.accent, flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ animation: "glow 3s infinite", display: "inline-block" }}>◈</span> Meu Painel
          </div>

          {/* Desktop nav in header */}
          {!mob && (
            <nav style={{ display: "flex", gap: 4 }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  background: tab === t.id ? G.accentSoft : "none",
                  color: tab === t.id ? G.accent : G.muted,
                  border: tab === t.id ? `1px solid ${G.accent}55` : "1px solid transparent",
                  borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s"
                }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </nav>
          )}

          <button onClick={() => setUnlocked(false)} style={{ background: "none", border: "none", color: G.muted, fontSize: 18, marginLeft: mob ? 8 : 16 }}>🔒</button>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: mob ? "16px 12px 88px" : "26px 28px 56px", maxWidth: 1100, width: "100%", margin: "0 auto" }}>
          {tab === "overview" && <OverviewTab subs={data.subs} domains={data.domains} finances={data.finances} projects={data.projects} />}
          {tab === "subs" && <SubsTab data={data.subs} onUpdate={update("subs")} />}
          {tab === "domains" && <DomainsTab data={data.domains} onUpdate={update("domains")} />}
          {tab === "finances" && <FinancesTab data={data.finances} onUpdate={update("finances")} />}
          {tab === "projects" && <ProjectsTab data={data.projects} onUpdate={update("projects")} />}
        </main>

        {/* Mobile bottom nav */}
        {mob && (
          <nav style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: G.surface, borderTop: `1px solid ${G.border}`,
            display: "flex", zIndex: 50,
            boxShadow: "0 -4px 20px rgba(74,144,217,0.10)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)"
          }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, background: "none", border: "none",
                color: tab === t.id ? G.accent : G.muted,
                padding: "10px 4px 7px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                transition: "color 0.15s"
              }}>
                <span style={{ fontSize: 20 }}>{t.icon}</span>
                <span style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
                {tab === t.id && <div style={{ width: 20, height: 3, background: G.accent, borderRadius: 2, marginTop: 1 }} />}
              </button>
            ))}
          </nav>
        )}

        {/* Desktop footer */}
        {!mob && (
          <footer style={{ borderTop: `1px solid ${G.border}`, padding: "10px 28px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: G.dim, fontSize: 11, fontFamily: "'JetBrains Mono'" }}>painel privado · dados salvos automaticamente</span>
            <span style={{ color: G.dim, fontSize: 11 }}>{new Date().toLocaleDateString("pt-BR")}</span>
          </footer>
        )}
      </div>
    </>
  );
}