import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "./supabaseClient";
import senacLogo from "./logo-senac.png";

const bgAnim = {
  position: "fixed",
  top: 0, left: 0, width: "100vw", height: "100vh",
  background: "linear-gradient(120deg,#141e30 0%,#17408c 50%,#f9b233 100%)",
  zIndex: -1,
  animation: "movebg 10s ease-in-out infinite alternate"
};



// Alternância via LocalStorage
function getUltimoTipoLocal(usuario) {
  usuario = usuario.trim();
  return localStorage.getItem("ultimoTipo_" + usuario);
}

function setUltimoTipoLocal(usuario, tipo) {
  usuario = usuario.trim();
  localStorage.setItem("ultimoTipo_" + usuario, tipo);
}

// Salva registro de ponto
async function registrarPonto(usuario, tipo) {
  usuario = usuario.trim();
  const { error, data } = await supabase.from('registros').insert([
    { usuario, tipo, datahora: new Date().toISOString() }
  ]);
  if (error) {
    alert("Erro ao registrar ponto: " + error.message);
    console.log(error);
  } else {
    console.log("Registro salvo!", data);
  }
}

// Busca agenda personalizada do usuário para a data
async function buscarAgendaUsuario(usuarioId, data) {
  const { data: eventos, error } = await supabase
    .from("agenda")
    .select("hora, descricao")
    .eq("usuario_id", usuarioId)
    .eq("data", data)
    .order("hora", { ascending: true });
  if (error) {
    console.log("Erro ao buscar agenda:", error.message);
    return [];
  }
  return eventos || [];
}

// Calcula total de horas na agenda do dia
function calcularTotalHoras(eventos) {
  if (!eventos || eventos.length === 0) return 0;
  
  // Agrupa eventos em blocos contínuos (ex: 08:00-12:00, 13:00-17:00)
  const horarios = eventos.map(e => {
    const [h, m] = e.hora.split(':').map(Number);
    return h + m / 60; // Converte para decimal (ex: 08:30 = 8.5)
  }).sort((a, b) => a - b);

  let totalHoras = 0;
  let inicio = horarios[0];
  let ultimo = horarios[0];

  for (let i = 1; i < horarios.length; i++) {
    // Se a diferença for maior que 1 hora, considera um novo bloco
    if (horarios[i] - ultimo > 1) {
      totalHoras += ultimo - inicio;
      inicio = horarios[i];
    }
    ultimo = horarios[i];
  }
  
  // Adiciona o último bloco
  totalHoras += ultimo - inicio;
  
  return Math.round(totalHoras * 10) / 10; // Arredonda para 1 casa decimal
}

function PointFlow() {
  const [atividades, setAtividades] = useState([]);
  const [showScanner, setShowScanner] = useState(true); // Inicia com câmera aberta
  const [mensagem, setMensagem] = useState("");
  const [tipoPonto, setTipoPonto] = useState("");
  const [totalHorasDia, setTotalHorasDia] = useState(0);
  const [fade, setFade] = useState("in");
  const html5QrCodeRef = useRef(null);
  const timeoutRef = useRef(null);
  const agendaTimeoutRef = useRef(null);

  async function buscarAtividades(qrCodeMessage) {
    const usuarioId = qrCodeMessage.trim();
    // Data de hoje (YYYY-MM-DD)
    const hoje = new Date().toISOString().slice(0,10);

    // Busca agenda personalizada do usuário
    let eventos = await buscarAgendaUsuario(usuarioId, hoje);
    setAtividades(eventos);
    
    // Calcula total de horas se houver eventos
    const totalHoras = calcularTotalHoras(eventos);
    setTotalHorasDia(totalHoras);
    
    if (!eventos.length) {
      setMensagem("Nenhuma atividade cadastrada para hoje.");
    }

    // Alternância instantânea via LocalStorage
    let ultimoTipo = getUltimoTipoLocal(usuarioId);
    let proximoTipo = (ultimoTipo === "entrada") ? "saida" : "entrada";
    setUltimoTipoLocal(usuarioId, proximoTipo);

    setTipoPonto(proximoTipo);
    setMensagem(
      `Bem-vindo(a), ${usuarioId}! Seu registro foi marcado como "${proximoTipo.toUpperCase()}".`
    );
    await registrarPonto(usuarioId, proximoTipo);
  }

  async function destroyScanner() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.stop(); } catch (e) {}
      try { await html5QrCodeRef.current.clear(); } catch (e) {}
      html5QrCodeRef.current = null;
    }
    const readerDiv = document.getElementById("reader");
    if (readerDiv) readerDiv.innerHTML = "";
  }

  useEffect(() => {
    if (showScanner) {
      html5QrCodeRef.current = new Html5Qrcode("reader");
      html5QrCodeRef.current
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 220 },
          async qrCodeMessage => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            await destroyScanner();
            setShowScanner(false);
            setFade("in");
            await buscarAtividades(qrCodeMessage);
          },
          errorMessage => {}
        )
        .catch(async err => {
          setMensagem("Não foi possível acessar a câmera: " + err);
          await destroyScanner();
          setShowScanner(false);
          setFade("in");
        });

      return () => { destroyScanner(); };
    } else { destroyScanner(); }
    // eslint-disable-next-line
  }, [showScanner]);

  useEffect(() => {
    if (atividades.length > 0) {
      agendaTimeoutRef.current = setTimeout(() => {
        setFade("out");
        setTimeout(() => {
          setAtividades([]);
          setMensagem("");
          setTipoPonto("");
          setTotalHorasDia(0);
          setShowScanner(true); // Reinicia o scanner após fechar a agenda
          setFade("in");
        }, 300);
      }, 15000);

      return () => {
        if (agendaTimeoutRef.current) {
          clearTimeout(agendaTimeoutRef.current);
          agendaTimeoutRef.current = null;
        }
      };
    }
  }, [atividades.length]);

  function backToMenu() {
    setFade("out");
    setTimeout(() => {
      setAtividades([]);
      setMensagem("");
      setTipoPonto("");
      setTotalHorasDia(0);
      setShowScanner(true); // Reinicia o scanner ao voltar
      setFade("in");
    }, 300);
  }

  return (
    <div className="main-container">
      <div style={bgAnim}></div>
      <div className={fade === "in" ? "fade-in" : "fade-out"} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: 640 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <img src={senacLogo} alt="Senac" style={{ height: 48, filter: 'drop-shadow(0 0 10px #f9b233cc) brightness(1.1)' }} />
          </div>
          <h2 style={{ textAlign: 'center', marginBottom: 10 }}>PointFlow</h2>
          <div style={{ textAlign: 'center', color: 'var(--senac-yellow)', fontWeight: 700, marginBottom: showScanner ? 20 : 8 }}>Controle de Ponto Inteligente Senac</div>

          {showScanner && atividades.length === 0 && (
            <div style={{ textAlign: 'center' }}>
              <div id="reader" style={{ width: 300, height: 300, margin: '0 auto', borderRadius: 16, background: '#0b1120', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
              <div style={{ marginTop: 18, color: 'var(--text-muted)' }}>
                <div style={{ background: 'linear-gradient(90deg,var(--senac-yellow) 40%, var(--senac-blue) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>Aponte o QR Code do seu crachá</div>
                <div style={{ color: 'var(--senac-yellow)', marginTop: 8, opacity: 0.9 }}>Câmera pronta para leitura</div>
              </div>
              {mensagem && <div style={{ color: '#fc5050', textAlign: 'center', marginTop: 12, fontSize: '0.95em' }}>{mensagem}</div>}
            </div>
          )}

          {atividades.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <h3 style={{ textAlign: 'center', marginBottom: 12 }}>Atividades do Dia</h3>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <span style={{ color: tipoPonto === 'entrada' ? 'var(--accent)' : '#fc5050', fontWeight: 800 }}>
                  {tipoPonto === 'entrada' ? 'Ponto registrado como ENTRADA' : tipoPonto === 'saida' ? 'Ponto registrado como SAÍDA' : ''}
                </span>
              </div>
              
              {tipoPonto === 'saida' && totalHorasDia > 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: 16, 
                  padding: '12px', 
                  background: 'linear-gradient(135deg, rgba(249, 178, 51, 0.15), rgba(23, 64, 140, 0.15))',
                  borderRadius: 12,
                  border: '2px solid var(--senac-yellow)'
                }}>
                  <div style={{ color: 'var(--senac-yellow)', fontSize: '0.9em', marginBottom: 4 }}>
                    📊 HOJE SEU DIA TEVE
                  </div>
                  <div style={{ 
                    fontSize: '1.8em', 
                    fontWeight: 900, 
                    background: 'linear-gradient(90deg, var(--senac-yellow) 30%, var(--accent) 70%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {totalHorasDia} {totalHorasDia === 1 ? 'HORA' : 'HORAS'}
                  </div>
                  <div style={{ color: 'var(--senac-yellow)', fontSize: '0.85em', marginTop: 4, opacity: 0.9 }}>
                    registradas na sua agenda
                  </div>
                </div>
              )}
              
              <ul className="activity-list">
                {atividades.map((a, i) => (
                  <li key={i} className="activity-item">
                    <div className="activity-time">{a.hora}</div>
                    <div>{a.descricao}</div>
                  </li>
                ))}
              </ul>
              <div style={{ color: 'var(--senac-yellow)', textAlign: 'center', marginTop: 8 }}>Esta agenda será fechada automaticamente em 15 segundos.</div>
              <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={backToMenu}>Voltar agora</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PointFlow;
