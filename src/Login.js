import React, { useState } from "react";

function Login({ onLoginSuccess }) {
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();

        // Senha padrão (você pode mudar depois)
        const SENHA_ADM = "admin123";

        if (senha === SENHA_ADM) {
            setErro("");
            onLoginSuccess();
        } else {
            setErro("Senha incorreta!");
            setSenha("");
        }
    };

    return (
        <div className="page-wrapper">
            <div className="card center" style={{ maxWidth: 400, width: '100%' }}>
                <h2>Acesso Administrativo</h2>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: 20 }}>
                    Digite a senha para acessar o painel administrativo
                </p>

                <form onSubmit={handleLogin} style={{ width: '100%' }}>
                    <label>Senha</label>
                    <input
                        type="password"
                        placeholder="Digite a senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                        autoFocus
                    />

                    {erro && (
                        <div style={{
                            color: '#fc5050',
                            textAlign: 'center',
                            marginBottom: 12,
                            padding: '8px',
                            background: 'rgba(252, 80, 80, 0.1)',
                            borderRadius: 8
                        }}>
                            {erro}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary">
                        Entrar
                    </button>
                </form>

                <button
                    className="btn btn-ghost"
                    onClick={() => window.location.reload()}
                    style={{ marginTop: 12 }}
                >
                    Voltar ao registro de ponto
                </button>
            </div>
        </div>
    );
}

export default Login;
