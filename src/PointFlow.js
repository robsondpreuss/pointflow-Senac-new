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
    console.log("✅ Registro salvo com sucesso!", data);
  }
}

// Busca agenda personalizada do usuário para a data
async function buscarAgendaUsuario(usuarioId, data) {
  console.log("🔎 Parametros busca - usuario_id:", usuarioId, "data:", data);

  const { data: eventos, error } = await supabase
    .from("agenda")
    .select("hora_inicio, hora_fim, descricao")
    .eq("usuario_id", usuarioId)
    .eq("data", data)
    .order("hora_inicio", { ascending: true });

  if (error) {
    console.error("❌ Erro ao buscar agenda:", error);
    return [];
  }

  console.log("✅ Resultado da query:", eventos);
  return eventos || [];
}

// Calcula total de horas na agenda do dia
function calcularTotalHoras(eventos) {
  if (!eventos || eventos.length === 0) return 0;

  let totalHoras = 0;

  eventos.forEach(evento => {
    if (evento.hora_inicio && evento.hora_fim) {
      // Converte hora_inicio para decimal (ex: "08:30" -> 8.5)
      const [hInicio, mInicio] = evento.hora_inicio.split(':').map(Number);
      const inicioDecimal = hInicio + mInicio / 60;

      // Converte hora_fim para decimal (ex: "12:00" -> 12.0)
      const [hFim, mFim] = evento.hora_fim.split(':').map(Number);
      const fimDecimal = hFim + mFim / 60;

      // Calcula diferença
      const duracao = fimDecimal - inicioDecimal;

      if (duracao > 0) {
        totalHoras += duracao;
      }
    }
  });

  console.log("⏰ Total de horas calculado:", totalHoras);
  return Math.round(totalHoras * 10) / 10; // Arredonda para 1 casa decimal
}

function PointFlow() {
  const [atividades, setAtividades] = useState([]);
  const [showScanner, setShowScanner] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [tipoPonto, setTipoPonto] = useState("");
  const [totalHorasDia, setTotalHorasDia] = useState(0);
  const [fade, setFade] = useState("in");
  const [pontoRegistrado, setPontoRegistrado] = useState(false); // NOVO: controla exibição
  const [cameraAtiva, setCameraAtiva] = useState(""); // NOVO: indica qual câmera está ativa
  const html5QrCodeRef = useRef(null);
  const timeoutRef = useRef(null);
  const agendaTimeoutRef = useRef(null);
  const processandoRef = useRef(false);
  const scannerAtivo = useRef(false); // NOVO: controla se scanner está ativo

  async function buscarAtividades(qrCodeMessage) {
    if (processandoRef.current) {
      console.log("⚠️ Busca já em andamento, ignorando...");
      return;
    }

    processandoRef.current = true;
    console.log("🔍 Iniciando busca de atividades para:", qrCodeMessage);

    try {
      const usuarioId = qrCodeMessage.trim();

      const hoje = new Date();
      const dataLocal = hoje.getFullYear() + '-' +
        String(hoje.getMonth() + 1).padStart(2, '0') + '-' +
        String(hoje.getDate()).padStart(2, '0');
      console.log("📅 Data de hoje (local):", dataLocal);

      let eventos = await buscarAgendaUsuario(usuarioId, dataLocal);
      console.log("📋 Eventos encontrados:", eventos);
      console.log("📊 Quantidade de eventos:", eventos?.length || 0);

      setAtividades(eventos);

      const totalHoras = calcularTotalHoras(eventos);
      console.log("⏱️ Total de horas:", totalHoras);
      setTotalHorasDia(totalHoras);

      if (!eventos.length) {
        setMensagem("Nenhuma atividade cadastrada para hoje.");
      }

      let ultimoTipo = getUltimoTipoLocal(usuarioId);
      let proximoTipo = (ultimoTipo === "entrada") ? "saida" : "entrada";
      setUltimoTipoLocal(usuarioId, proximoTipo);

      setTipoPonto(proximoTipo);
      setMensagem(
        `Bem-vindo(a), ${usuarioId}! Seu registro foi marcado como "${proximoTipo.toUpperCase()}".`
      );

      await registrarPonto(usuarioId, proximoTipo);
      setPontoRegistrado(true); // NOVO: marca que ponto foi registrado
      console.log("✅ Processo completo!");

    } catch (error) {
      console.error("❌ Erro no processo:", error);
      setMensagem("Erro ao processar registro: " + error.message);
    } finally {
      setTimeout(() => {
        processandoRef.current = false;
      }, 2000); // Aumentado para 2 segundos
    }
  }

  async function destroyScanner() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const scanner = html5QrCodeRef.current;
    html5QrCodeRef.current = null;
    scannerAtivo.current = false;

    if (scanner) {
      try {
        const state = await scanner.getState();
        if (state === 2) { // 2 = SCANNING
          await scanner.stop();
          console.log("📷 Scanner parado");
        }
      } catch (e) {
        console.log("⚠️ Scanner não estava rodando");
      }
      try {
        await scanner.clear();
      } catch (e) { }
    }

    // Limpa o HTML do div reader
    const readerDiv = document.getElementById("reader");
    if (readerDiv) {
      readerDiv.innerHTML = "";
    }
  }

  useEffect(() => {
    let mounted = true; // Flag para controlar se o componente está montado

    const initScanner = async () => {
      // Limpa qualquer scanner existente primeiro
      await destroyScanner();

      if (!mounted || !showScanner) return;

      console.log("📷 Iniciando scanner...");
      scannerAtivo.current = true;

      const scanner = new Html5Qrcode("reader");
      html5QrCodeRef.current = scanner;

      // Função para tentar iniciar o scanner
      const tentarIniciarCamera = async (facingMode) => {
        try {
          console.log(`🎥 Tentando câmera: ${facingMode}`);
          await scanner.start(
            { facingMode: facingMode },
            { fps: 10, qrbox: 220 },
            async qrCodeMessage => {
              if (!scannerAtivo.current || !mounted) {
                console.log("⚠️ Scanner já foi parado, ignorando leitura");
                return;
              }

              console.log("📸 QR Code lido:", qrCodeMessage);

              // Para o scanner antes de processar
              await destroyScanner();
              setShowScanner(false);
              setFade("in");

              // Aguarda um pouco antes de processar
              await new Promise(resolve => setTimeout(resolve, 300));
              await buscarAtividades(qrCodeMessage);
            },
            errorMessage => { }
          );
          console.log(`✅ Câmera ${facingMode} iniciada com sucesso`);
          setCameraAtiva(facingMode === "user" ? "frontal" : "traseira");
          return true;
        } catch (err) {
          console.log(`⚠️ Falha ao usar câmera ${facingMode}:`, err.message);
          return false;
        }
      };

      try {
        // Tenta primeiro a câmera frontal (user)
        let sucesso = await tentarIniciarCamera("user");

        // Se falhar, tenta a câmera traseira (environment)
        if (!sucesso) {
          console.log("🔄 Tentando câmera traseira...");
          sucesso = await tentarIniciarCamera("environment");
        }

        // Se nenhuma funcionar, mostra erro
        if (!sucesso) {
          throw new Error("Não foi possível acessar nenhuma câmera");
        }

      } catch (err) {
        console.error("❌ Erro ao iniciar câmera:", err);
        setMensagem("Não foi possível acessar a câmera: " + err);
        await destroyScanner();
        setShowScanner(false);
        setFade("in");
      }
    };

    if (showScanner && !html5QrCodeRef.current) {
      initScanner();
    } else if (!showScanner) {
      destroyScanner();
    }

    return () => {
      console.log("🧹 Limpando scanner no cleanup");
      mounted = false;
      destroyScanner();
    };
  }, [showScanner]);

  useEffect(() => {
    if (pontoRegistrado && !agendaTimeoutRef.current) {
      agendaTimeoutRef.current = setTimeout(() => {
        setFade("out");
        setTimeout(() => {
          setAtividades([]);
          setMensagem("");
          setTipoPonto("");
          setTotalHorasDia(0);
          setPontoRegistrado(false);
          setCameraAtiva(""); // Reseta indicador de câmera
          setShowScanner(true);
          setFade("in");
          agendaTimeoutRef.current = null;
        }, 300);
      }, 15000);

      return () => {
        if (agendaTimeoutRef.current) {
          clearTimeout(agendaTimeoutRef.current);
          agendaTimeoutRef.current = null;
        }
      };
    }
  }, [pontoRegistrado]);

  function backToMenu() {
    if (agendaTimeoutRef.current) {
      clearTimeout(agendaTimeoutRef.current);
      agendaTimeoutRef.current = null;
    }

    setFade("out");
    setTimeout(() => {
      setAtividades([]);
      setMensagem("");
      setTipoPonto("");
      setTotalHorasDia(0);
      setPontoRegistrado(false);
      setCameraAtiva(""); // Reseta indicador de câmera
      setShowScanner(true);
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

          {showScanner && !pontoRegistrado && (
            <div style={{ textAlign: 'center' }}>
              <div id="reader" style={{ width: 300, height: 300, margin: '0 auto', borderRadius: 16, background: '#0b1120', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
              <div style={{ marginTop: 18, color: 'var(--text-muted)' }}>
                <div style={{ background: 'linear-gradient(90deg,var(--senac-yellow) 40%, var(--senac-blue) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>Aponte o QR Code do seu crachá</div>
                <div style={{ color: 'var(--senac-yellow)', marginTop: 8, opacity: 0.9 }}>
                  {cameraAtiva ? `Câmera ${cameraAtiva} ativa` : 'Iniciando câmera...'}
                </div>
              </div>
              {mensagem && <div style={{ color: '#fc5050', textAlign: 'center', marginTop: 12, fontSize: '0.95em' }}>{mensagem}</div>}
            </div>
          )}

          {pontoRegistrado && (
            <div style={{ marginTop: 18 }}>
              <h3 style={{ textAlign: 'center', marginBottom: 12 }}>
                {atividades.length > 0 ? 'Atividades do Dia' : 'Ponto Registrado'}
              </h3>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <span style={{ color: tipoPonto === 'entrada' ? 'var(--accent)' : '#fc5050', fontWeight: 800, fontSize: '1.2em' }}>
                  {tipoPonto === 'entrada' ? '✅ Ponto registrado como ENTRADA' : tipoPonto === 'saida' ? '✅ Ponto registrado como SAÍDA' : ''}
                </span>
              </div>

              {mensagem && (
                <div style={{
                  textAlign: 'center',
                  marginBottom: 16,
                  padding: '12px',
                  background: 'rgba(249, 178, 51, 0.1)',
                  borderRadius: 8,
                  color: 'var(--senac-yellow)'
                }}>
                  {mensagem}
                </div>
              )}

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

              {atividades.length > 0 && (
                <ul className="activity-list">
                  {atividades.map((a, i) => (
                    <li key={i} className="activity-item">
                      <div className="activity-time">
                        {a.hora_inicio} - {a.hora_fim}
                      </div>
                      <div>{a.descricao}</div>
                    </li>
                  ))}
                </ul>
              )}

              <div style={{ color: 'var(--senac-yellow)', textAlign: 'center', marginTop: 12 }}>Esta tela será fechada automaticamente em 15 segundos.</div>
              <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={backToMenu}>Voltar agora</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PointFlow;
