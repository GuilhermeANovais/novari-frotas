# 🚜 Gestor de Frotas Municipal (Novari)

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![React](https://img.shields.io/badge/React-18-blue?&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?&logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-9.0-FFCA28?&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?&logo=tailwind-css)

Sistema moderno de gestão de frotas municipais desenvolvido como uma Single Page Application (SPA). O projeto foca em controle de custos, monitoramento de manutenção, gestão de motoristas e auditoria de atividades, com uma interface minimalista e responsiva

---

## ✨ Funcionalidades

### 🚗 Gestão de Veículos
- **CRUD Completo:** Criação, leitura, atualização e exclusão segura (soft/hard delete).
- **Ficha Técnica:** Modal de visualização com foto, dados do chassi, RENAVAM e status.
- **Validação Robusta:** Integração **Zod + React Hook Form** para garantir dados consistentes (ex: placas no padrão Mercosul/Antigo, anos válidos).
- **Upload de Imagens:** Integração com Firebase Storage para fotos dos veículos.

### 🛠️ Controle de Manutenção
- **Histórico Financeiro:** Registro de serviços com separação de custos (Peças vs. Mão de Obra).
- **Cálculo Automático:** Atualização automática do custo total do veículo.
- **Alertas:** Identificação visual de veículos que necessitam de revisão (baseado em data ou quilometragem).

### 👮 Gestão de Motoristas
- **Controle de CNH:** Monitoramento automático de vencimento da habilitação (Alertas de 45 dias).
- **Vínculo:** Associação de motoristas a departamentos específicos.

### 📈 Relatórios & Auditoria
- **Gráficos:** Análise visual de custos por departamento (Chart.js).
- **Exportação:** Geração de relatórios completos em Excel (.xlsx).
- **Logs de Atividade:** Rastreabilidade de quem criou, editou ou excluiu registros (Auditoria).

---

## 🚀 Tecnologias Utilizadas

- **Core:** React 18, TypeScript, Vite.
- **Estilização:** Tailwind CSS (Design System customizado), Lucide React (Ícones).
- **Backend (BaaS):** Firebase Authentication, Cloud Firestore, Cloud Storage.
- **Formulários:** React Hook Form, Zod (Schema Validation).
- **Dados:** ExcelJS (Exportação), Chart.js (Gráficos).
- **UX:** Sonner (Toasts/Notificações), Skeletons (Loading States).

---

## ⚙️ Pré-requisitos

Antes de começar, certifique-se de ter instalado:
- [Node.js](https://nodejs.org/en/) (v18 ou superior)
- [NPM](https://www.npmjs.com/)

---

## 🔧 Instalação e Configuração

1. **Clone o repositório**
   ```bash
   git clone https://github.com/GuilhermeANovais/novari-frotas.git
   cd novari-frotas
   ```
2. **Instale as depedências**
   ```bash
   npm install
   ```
3. **Configure as Variáveis de Ambiente `.env`**
   ```.env
   VITE_FIREBASE_API_KEY=sua_api_key  
   VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com  
   VITE_FIREBASE_PROJECT_ID=seu_projeto  
   VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com  
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu_id  
   VITE_FIREBASE_APP_ID=seu_app_id  
   VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id
   ```
4. **Execute o projeto**
   ```bash
   npm run dev
   ```

--- 

## 📂 Estrutura do Projeto
```
src/
├── assets/          # Imagens e logotipos
├── components/      # Componentes reutilizáveis (Input, Modal, Header, etc.)
├── contexts/        # Context API (AuthContext)
├── hooks/           # Custom Hooks (useVehicles, useAllData)
├── pages/           # Páginas da aplicação (Dashboard, Login, Details)
├── services/        # Configuração do Firebase e Logger
├── types/           # Definições de Tipos TypeScript (Interfaces)
└── utils/           # Funções auxiliares de cálculo e formatação
```

---

## Melhorias
- [ ] Controle de Abastecimento
- [ ] Gestão de Multas
- [X] Gestão Eletrônica de Documentos (GED)
- [ ] Localização em tempo real do veículo

---

## 📝 Licença
Este projeto é desenvolvido para uso interno de gestão municipal. Todos os direitos reservados.  
Desenvolvido por [Guilherme Novais](https://github.com/GuilhermeANovais)

---

## Contatos
<a href="https://www.linkedin.com/in/guilherme-novais0/" target="_blank"><img loading="lazy" src="https://img.shields.io/badge/-LinkedIn-%230077B5?style=for-the-badge&logo=linkedin&logoColor=white" target="_blank"></a>
<a href="mailto:jose.guilherme.a.novais@gmail.com"> <img loading="lazy" src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" target="_blank"></a>
<a href="https://www.instagram.com/guinwv"> <img loading="lazy" src="https://img.shields.io/badge/Instagram-%23E4405F.svg?style=for-the-badge&logo=Instagram&logoColor=white" target="_blank"></a> 
