import React, { useState } from "react";
import './modern.css';
import PointFlow from "./PointFlow";
import CadastroUsuario from "./CadastroUsuario";
import CadastroAgenda from "./CadastroAgenda";

function App() {
  const [tela, setTela] = useState("pointflow");
  const [menuAberto, setMenuAberto] = useState(false);

  const mudarTela = (novaTela) => {
    setTela(novaTela);
    setMenuAberto(false); // Fecha menu ao selecionar
  };

  const toggleMenu = () => {
    console.log('Menu clicado! Estado atual:', menuAberto);
    setMenuAberto(!menuAberto);
  };

  return (
    <div className="main-container">
      <div className="navbar card">
        <div className="brand">
          <img src={require('./logo-senac.png')} alt="Senac" />
          <h1>PointFlow</h1>
        </div>

        {/* Botão hamburguer - apenas mobile */}
        <button
          className="hamburger-btn"
          onClick={toggleMenu}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Menu de navegação */}
        <div className={`nav-links ${menuAberto ? 'open' : ''}`}>
          <button className="btn btn-ghost" onClick={() => mudarTela('pointflow')}>
            Registrar Ponto
          </button>
          <button className="btn btn-ghost" onClick={() => mudarTela('cadastro')}>
            Usuários
          </button>
          <button className="btn btn-ghost" onClick={() => mudarTela('agenda')}>
            Agenda
          </button>
        </div>
      </div>

      <div className="page-wrapper">
        {tela === "pointflow" && <PointFlow />}
        {tela === "cadastro" && <CadastroUsuario />}
        {tela === "agenda" && <CadastroAgenda />}
      </div>
    </div>
  );
}

export default App;
