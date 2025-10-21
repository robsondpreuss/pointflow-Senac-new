import React, { useState } from "react";
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
      setNome(""); setEmail("");
    }
  }

  return (
    <div className="card center" style={{ maxWidth: 640, margin: '40px auto' }}>
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
  );
}

export default CadastroUsuario;
