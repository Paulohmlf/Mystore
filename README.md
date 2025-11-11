# 📦 Controle de Estoque - App Expo React Native

Um aplicativo móvel simples e eficiente para **gerenciamento de estoque**, desenvolvido com **Expo** e **React Native**.  
Permite registrar entradas e saídas de produtos, acompanhar lucros e gerar relatórios detalhados do inventário.

---

## 🚀 Funcionalidades

✅ Registro de **entradas** de produtos  
✅ Registro de **saídas** (vendas ou retiradas)  
✅ **Cálculo automático de lucros** com base em entradas e saídas  
✅ **Edição de registros** de saída  
✅ **Relatórios detalhados** para análise do estoque  
✅ **Armazenamento local** com AsyncStorage (sem necessidade de conexão com internet)

---

## 🛠️ Tecnologias Utilizadas

- **React Native (Expo)**
- **TypeScript**
- **AsyncStorage** → persistência local
- **ESLint** → padronização de código
- **Babel** e **Metro** → bundling e compatibilidade

---

## 🖥️ Telas do Aplicativo

| Tela | Descrição |
|------|------------|
| **EntradaScreen** | Registro de novas entradas de produtos |
| **SaidaScreen** | Registro de saídas (vendas/retiradas) |
| **EditarSaidaScreen** | Edição de registros de saída |
| **RelatorioScreen** | Visualização e análise de relatórios |
| **EdicaoScreen** | Edição geral de registros |

---

## ⚙️ Como Executar o Projeto

```bash
# 1️⃣ Clone o repositório
git clone <URL-DO-REPOSITORIO>
cd <NOME-DO-REPOSITORIO>

# 2️⃣ Instale as dependências
npm install

# 3️⃣ Execute o app em modo de desenvolvimento
npm start
```

📱 Depois, abra o app com o **Expo Go** no seu smartphone ou use um **emulador Android/iOS**.

---

## 🧩 Estrutura do Projeto

```
📁 src/
 ┣ 📄 App.tsx                 → Arquivo principal e navegação
 ┣ 📄 EntradaScreen.tsx       → Tela de registro de entradas
 ┣ 📄 SaidaScreen.tsx         → Tela de registro de saídas
 ┣ 📄 EditarSaidaScreen.tsx   → Tela de edição de saídas
 ┣ 📄 RelatorioScreen.tsx     → Tela de relatórios
 ┣ 📄 EdicaoScreen.tsx        → Tela de edição geral
 ┣ 📄 storage.ts              → Funções para manipular o AsyncStorage
📄 babel.config.js
📄 eslint.config.js
📄 app.json
```

---

## 🤝 Contribuições

Contribuições são **muito bem-vindas**!  
- Abra uma **issue** para relatar bugs ou sugerir melhorias.  
- Envie um **pull request** com suas alterações.

---

## 📜 Licença

Este projeto está sob a licença **MIT**.

---

👨‍💻 Desenvolvido por **João Lima** e **Paulo Henrique** 
