import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

function CadastroAgenda() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioId, setUsuarioId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [descricao, setDescricao] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    async function fetchUsuarios() {
      const { data } = await supabase.from("usuarios").select("id, nome").order("nome");
      setUsuarios(data || []);
    }
    fetchUsuarios();
  }, []);

  async function cadastrar(e) {
    e.preventDefault();
    const { error } = await supabase.from("agenda").insert([
      { usuario_id: usuarioId, data, hora, descricao }
    ]);
    if (error) setMensagem("Erro ao cadastrar: " + error.message);
    else {
      setMensagem("Evento cadastrado!");
      setData(""); setHora(""); setDescricao("");
    }
  }

  return (
    <div className="card center" style={{ maxWidth: 720, margin: '100px auto' }}>
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
  );
}

export default CadastroAgenda;
