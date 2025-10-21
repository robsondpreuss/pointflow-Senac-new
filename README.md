# PointFlow

Controle de ponto digital com QR Code e agenda personalizada, usando React + Supabase.

## Funcionalidades

- Registro de entrada/saída via QR Code (crachá)
- Cadastro de usuários com ID único
- Cadastro de agenda/atividades para cada usuário
- Integração com banco Supabase
- Visual moderno e adaptado ao branding Senac

## Configure as credenciais do Supabase

Este projeto usa Create React App (CRA) e lê variáveis de ambiente do arquivo `.env.local` na raiz do projeto (mesma pasta do `package.json`).

1) Crie um arquivo `.env.local` na raiz do projeto e adicione:

```
REACT_APP_SUPABASE_URL= sua_url_do_projeto_supabase
REACT_APP_SUPABASE_ANON_KEY= sua_anon_key_do_supabase
```

2) Não coloque `.env.local` dentro da pasta `src/` — o CRA ignora esse local e as variáveis não serão carregadas.

3) O arquivo `src/supabaseClient.js` já lê essas variáveis automaticamente via `process.env.REACT_APP_*`.

4) Sempre que alterar variáveis de ambiente, pare e reinicie o servidor de desenvolvimento (`npm start`).

## Como rodar

- npm install
- npm start