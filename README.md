# SIGEM — Sistema Integrado de Gerenciamento Escolar Municipal

Sistema web para gestão de escolas públicas de ensino fundamental (1º ao 9º ano).
Construído com **React + Firebase**.

---

## Pré-requisitos

- Node.js 18+
- Conta no [Firebase](https://console.firebase.google.com)

---

## Configuração do Firebase (passo a passo)

### 1. Crie o projeto Firebase
1. Acesse https://console.firebase.google.com
2. Clique em **Adicionar projeto** → dê um nome (ex: `edugestao-escola`)
3. Desative o Google Analytics (opcional) → **Criar projeto**

### 2. Ative o Firestore
1. No menu lateral: **Build → Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha **Modo de produção** → selecione a região `southamerica-east1` (São Paulo)
4. **Criar**

### 3. Regras do Firestore (cole em Regras)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Ative a Autenticação
1. No menu lateral: **Build → Authentication**
2. **Começar** → aba **Sign-in method**
3. Ative **E-mail/senha**
4. Vá em **Usuários → Adicionar usuário** e cadastre o e-mail/senha do administrador

### 5. Obtenha as credenciais
1. Ícone de engrenagem → **Configurações do projeto**
2. Role até **Seus apps** → clique em **</>** (Web)
3. Registre o app → copie o `firebaseConfig`

### 6. Cole as credenciais no projeto
Abra `src/firebase.js` e substitua os valores:
```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

---

## Instalação e execução

```bash
# Instale as dependências
npm install

# Inicie em modo desenvolvimento
npm start
```

Acesse: http://localhost:3000

---

## Estrutura do projeto

```
src/
├── firebase.js              # Configuração Firebase
├── App.jsx                  # Rotas principais
├── index.js                 # Entry point
│
├── contexts/
│   └── AuthContext.jsx       # Login/logout/sessão
│
├── hooks/
│   └── useFirestore.js       # Hook genérico para Firestore
│
├── services/                 # Comunicação com Firestore
│   ├── alunosService.js
│   ├── professoresService.js
│   ├── turmasService.js
│   ├── frequenciaService.js
│   └── notasService.js
│
├── pages/                    # Telas do sistema
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Alunos.jsx
│   ├── Professores.jsx
│   ├── Turmas.jsx
│   ├── Frequencia.jsx
│   ├── Notas.jsx
│   └── Relatorios.jsx
│
├── components/
│   ├── Layout.jsx            # Sidebar + topbar
│   ├── Layout.module.css
│   └── ui.jsx                # Card, Badge, Btn, Modal, Input...
│
└── utils/
    └── constants.js          # Anos, turnos, disciplinas, helpers
```

---

## Coleções no Firestore

| Coleção       | Campos principais                                              |
|---------------|----------------------------------------------------------------|
| `alunos`      | nome, matricula, ano, turma, turno, nascimento, responsavel, status |
| `professores` | nome, cpf, email, telefone, turno, disciplinas[], status       |
| `turmas`      | nome, ano, turno, professor, sala, vagas                       |
| `frequencias` | alunoId, turma, ano, mes, dias{1:"P", 2:"F", ...}             |
| `notas`       | alunoId, turma, disciplina, anoLetivo, bimestres{b1,b2,b3,b4}, media |

---

## Build para produção

```bash
npm run build
```

A pasta `build/` pode ser hospedada no **Firebase Hosting**:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # aponte para a pasta build/
firebase deploy
```
