import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

function gerarIdUsuario() {
  // Gera uma string de 10 dígitos aleatórios (não começa com zero)
  let id = Math.floor(Math.random() * 9 + 1).toString();
  while (id.length < 10) id += Math.floor(Math.random() * 10).toString();
  return id;
}

function CadastroUsuario() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [idUsuario, setIdUsuario] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [agendaPopup, setAgendaPopup] = useState([]);
  const [mostrarPopup, setMostrarPopup] = useState(false);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, email")
      .order("nome", { ascending: true });
    
    if (!error) {
      setUsuarios(data || []);
    }
  }

  async function cadastrar(e) {
    e.preventDefault();
    const novoId = gerarIdUsuario();
    const { error } = await supabase.from("usuarios").insert([
      { id: novoId, nome, email }
    ]);
    if (error) {
      setMensagem("Erro ao cadastrar: " + error.message);
      setIdUsuario("");
    } else {
      setMensagem("Usuário cadastrado com sucesso! ID: " + novoId);
      setIdUsuario(novoId);
      setNome(""); 
      setEmail("");
      carregarUsuarios(); // Recarrega a lista
    }
  }

  async function verAgenda(usuario) {
    setUsuarioSelecionado(usuario);
    
    // Usa data local ao invés de UTC para evitar problemas de timezone
    const hoje = new Date();
    const dataLocal = hoje.getFullYear() + '-' + 
                     String(hoje.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(hoje.getDate()).padStart(2, '0');
    
    console.log("🔍 [POPUP] Buscando agenda para usuário:");
    console.log("  - Nome:", usuario.nome);
    console.log("  - usuario.id:", usuario.id, "tipo:", typeof usuario.id);
    console.log("  - Data (local):", dataLocal);
    
    const { data: eventos, error } = await supabase
      .from("agenda")
      .select("hora, descricao")
      .eq("usuario_id", usuario.id)
      .eq("data", dataLocal)
      .order("hora", { ascending: true });
    
    console.log("📋 [POPUP] Resultado da busca:");
    console.log("  - Erro:", error);
    console.log("  - Eventos encontrados:", eventos);
    console.log("  - Quantidade:", eventos?.length || 0);
    
    if (!error) {
      setAgendaPopup(eventos || []);
      setMostrarPopup(true);
    } else {
      console.error("❌ [POPUP] Erro ao buscar agenda:", error);
      setAgendaPopup([]);
      setMostrarPopup(true);
    }
  }

  function fecharPopup() {
    setMostrarPopup(false);
    setUsuarioSelecionado(null);
    setAgendaPopup([]);
  }

  return (
    <div className="page-wrapper">
      <div className="center-card">
        <div className="card center" style={{ maxWidth: 640, margin: '0 auto 20px' }}>
          <form onSubmit={cadastrar} className="form-card">
            <h3>Cadastro de Usuário</h3>
            <label>Nome</label>
            <input type="text" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} required />
            <label>Email (opcional)</label>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <button type="submit" className="btn btn-primary">Cadastrar</button>
            {idUsuario && (
              <div style={{ marginTop: 12, color: 'var(--accent)', fontWeight: 700 }}>
                <div>ID do usuário: <span style={{ fontFamily: "monospace", fontSize: "1.05em" }}>{idUsuario}</span></div>
                <div style={{ color: 'var(--senac-yellow)', fontSize: "0.9em" }}>Este ID deve ser transformado em QR Code para o crachá!</div>
              </div>
            )}
            <div style={{ color: 'var(--senac-yellow)', marginTop: 8 }}>{mensagem}</div>
          </form>
        </div>

        {usuarios.length > 0 && (
          <div className="card" style={{ maxWidth: 640, margin: '0 auto' }}>
            <h3 style={{ textAlign: 'center', marginBottom: 16 }}>Usuários Cadastrados</h3>
            <div style={{ fontSize: '0.9em', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 12 }}>
              Clique em um usuário para ver a agenda de hoje
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 8,
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: 8
            }}>
              {usuarios.map(usuario => (
                <div
                  key={usuario.id}
                  onClick={() => verAgenda(usuario)}
                  style={{
                    padding: '14px 16px',
                    background: 'linear-gradient(90deg, rgba(23, 64, 140, 0.15), rgba(249, 178, 51, 0.05))',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, rgba(23, 64, 140, 0.25), rgba(249, 178, 51, 0.15))';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, rgba(23, 64, 140, 0.15), rgba(249, 178, 51, 0.05))';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--text-light)', marginBottom: 4 }}>
                    {usuario.nome}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85em', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      ID: {usuario.id}
                    </span>
                    {usuario.email && (
                      <span style={{ fontSize: '0.85em', color: 'var(--senac-yellow)' }}>
                        {usuario.email}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mostrarPopup && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 20,
            }}
            onClick={fecharPopup}
          >
            <div
              className="card"
              style={{
                maxWidth: 500,
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, textAlign: 'left' }}>
                  Agenda de Hoje
                </h3>
                <button
                  onClick={fecharPopup}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--senac-yellow)',
                    fontSize: '1.5em',
                    cursor: 'pointer',
                    padding: 0,
                    width: 'auto',
                    margin: 0,
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: 16, padding: 12, background: 'rgba(249, 178, 51, 0.1)', borderRadius: 8 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-light)' }}>
                  {usuarioSelecionado?.nome}
                </div>
                <div style={{ fontSize: '0.85em', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  ID: {usuarioSelecionado?.id}
                </div>
                <div style={{ fontSize: '0.85em', color: 'var(--senac-yellow)', marginTop: 4 }}>
                  {new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                </div>
              </div>

              {agendaPopup.length > 0 ? (
                <ul className="activity-list">
                  {agendaPopup.map((evento, i) => (
                    <li key={i} className="activity-item">
                      <div className="activity-time">{evento.hora}</div>
                      <div>{evento.descricao}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 40, 
                  color: 'var(--text-muted)',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 8,
                }}>
                  <div style={{ fontSize: '2em', marginBottom: 8 }}>📅</div>
                  <div>Nenhum evento cadastrado para hoje</div>
                </div>
              )}

              <button
                onClick={fecharPopup}
                className="btn btn-ghost"
                style={{ marginTop: 16, width: '100%' }}
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CadastroUsuario;
