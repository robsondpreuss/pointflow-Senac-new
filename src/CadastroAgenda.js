import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

function CadastroAgenda() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioId, setUsuarioId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [descricao, setDescricao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [eventosRecentes, setEventosRecentes] = useState([]);

  useEffect(() => {
    async function fetchUsuarios() {
      const { data } = await supabase.from("usuarios").select("id, nome").order("nome");
      setUsuarios(data || []);
    }
    fetchUsuarios();
    carregarEventosRecentes();
  }, []);

  async function carregarEventosRecentes() {
    const { data: eventos, error } = await supabase
      .from("agenda")
      .select(`
        *,
        usuarios:usuario_id (nome)
      `)
      .order("data", { ascending: false })
      .order("hora", { ascending: false })
      .limit(10);
    
    if (!error) {
      console.log("📋 Eventos cadastrados no banco:", eventos);
      setEventosRecentes(eventos || []);
    } else {
      console.error("❌ Erro ao carregar eventos:", error);
    }
  }

  async function cadastrar(e) {
    e.preventDefault();
    
    console.log("📝 Tentando cadastrar evento:");
    console.log("  - usuario_id:", usuarioId, "tipo:", typeof usuarioId);
    console.log("  - data:", data);
    console.log("  - hora:", hora);
    console.log("  - descricao:", descricao);
    
    const { data: resultado, error } = await supabase.from("agenda").insert([
      { usuario_id: usuarioId, data, hora, descricao }
    ]).select();
    
    if (error) {
      console.error("❌ Erro ao cadastrar:", error);
      setMensagem("Erro ao cadastrar: " + error.message);
    } else {
      console.log("✅ Evento cadastrado com sucesso:", resultado);
      setMensagem("Evento cadastrado com sucesso!");
      setData(""); 
      setHora(""); 
      setDescricao("");
      carregarEventosRecentes();
    }
  }

  return (
    <div className="page-wrapper">
      <div className="center-card">
        <div className="card center" style={{ maxWidth: 720, margin: '0 auto 20px' }}>
          <form onSubmit={cadastrar} className="form-card">
            <h3>Adicionar Evento na Agenda</h3>
            <label>Usuário</label>
            <select value={usuarioId} onChange={e => setUsuarioId(e.target.value)} required>
              <option value="">Selecione o usuário</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.id})</option>)}
            </select>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label>Data</label>
                <input type="date" value={data} onChange={e => setData(e.target.value)} required />
              </div>
              <div style={{ flex: 1 }}>
                <label>Hora</label>
                <input type="time" value={hora} onChange={e => setHora(e.target.value)} required />
              </div>
            </div>
            <label>Descrição</label>
            <input type="text" placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} required />
            <button type="submit" className="btn btn-primary">Cadastrar Evento</button>
            <div style={{ color: 'var(--senac-yellow)', marginTop: 8 }}>{mensagem}</div>
          </form>
        </div>

        {eventosRecentes.length > 0 && (
          <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
            <h3 style={{ textAlign: 'center', marginBottom: 16 }}>Últimos Eventos Cadastrados</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {eventosRecentes.map((evento, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    background: 'linear-gradient(90deg, rgba(23, 64, 140, 0.1), rgba(249, 178, 51, 0.05))',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-light)' }}>
                      {evento.usuarios?.nome || evento.usuario_id}
                    </span>
                    <span style={{ fontSize: '0.85em', color: 'var(--senac-yellow)' }}>
                      {new Date(evento.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ 
                      minWidth: 60, 
                      fontWeight: 800, 
                      color: 'var(--senac-yellow)',
                      fontSize: '0.9em'
                    }}>
                      {evento.hora}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.95em' }}>
                      {evento.descricao}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '0.75em', 
                    color: 'var(--text-muted)', 
                    marginTop: 4,
                    fontFamily: 'monospace'
                  }}>
                    ID: {evento.usuario_id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CadastroAgenda;
