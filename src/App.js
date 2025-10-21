import React, { useState } from "react";
import './modern.css';
import PointFlow from "./PointFlow";
import CadastroUsuario from "./CadastroUsuario";
import CadastroAgenda from "./CadastroAgenda";

function App() {
  const [tela, setTela] = useState("pointflow");

  return (
    <div className="main-container">
      <div className="navbar card">
        <div className="brand"><img src={require('./logo-senac.png')} alt="Senac" /><h1>PointFlow</h1></div>
        <div className="nav-links">
          <button className="btn btn-ghost" onClick={() => setTela('pointflow')}>Registrar Ponto</button>
          <button className="btn btn-ghost" onClick={() => setTela('cadastro')}>Usuários</button>
          <button className="btn btn-ghost" onClick={() => setTela('agenda')}>Agenda</button>
        </div>
      </div>
      {tela === "pointflow" && (
        <div className="page-wrapper">
          <div className="center-card">
            <PointFlow />
          </div>
        </div>
      )}
      {tela === "cadastro" && (
        <div>
          <CadastroUsuario />
        </div>
      )}
      {tela === "agenda" && (
        <div>
          <CadastroAgenda />
        </div>
      )}
    </div>
  );
}

export default App;
