import React, { useState } from "react";
import './modern.css';
import PointFlow from "./PointFlow";
import CadastroUsuario from "./CadastroUsuario";
import CadastroAgenda from "./CadastroAgenda";
import Login from "./Login";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [tela, setTela] = useState("cadastro");
  const [menuAberto, setMenuAberto] = useState(false);

  const mudarTela = (novaTela) => {
    setTela(novaTela);
    setMenuAberto(false);
  };

  const toggleMenu = () => {
    setMenuAberto(!menuAberto);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowLogin(false);
  };

  // Tela de Login
  if (showLogin && !isLoggedIn) {
    return (
      <div className="main-container">
        <Login onLoginSuccess={handleLoginSuccess} />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button className="btn btn-ghost" onClick={() => setShowLogin(false)}>
            Voltar para o QR Code
          </button>
        </div>
      </div>
    );
  }

  // Tela Pública - Apenas QR Code
  if (!isLoggedIn) {
    return (
      <div className="main-container">
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000
        }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowLogin(true)}
            style={{ width: '150px' }}
          >
            Login Admin
          </button>
        </div>
        <div className="page-wrapper">
          <PointFlow />
        </div>
      </div>
    );
  }

  // Tela Admin - Usuários e Agenda
  return (
    <div className="main-container">
      <div className="navbar card">
        <div className="brand">
          <img src={require('./logo-senac.png')} alt="Senac" />
          <h1>PointFlow Admin</h1>
        </div>

        <button
          className="hamburger-btn"
          onClick={toggleMenu}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`nav-links ${menuAberto ? 'open' : ''}`}>
          <button className="btn btn-ghost" onClick={() => mudarTela('cadastro')}>
            Usuários
          </button>
          <button className="btn btn-ghost" onClick={() => mudarTela('agenda')}>
            Agenda
          </button>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </div>

      <div className="page-wrapper">
        {tela === "cadastro" && <CadastroUsuario />}
        {tela === "agenda" && <CadastroAgenda />}
      </div>
    </div>
  );
}

export default App;
