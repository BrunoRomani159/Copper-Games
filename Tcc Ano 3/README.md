# Cooper Games — centro de jogos (React puro + Express, SEM banco de dados)

React 18 carregado direto no navegador (sem Vite, sem Webpack, sem build).
O Express serve o site e a API juntos. Os jogos ficam em memória (array), não precisa de MongoDB.

Requisitos: Node 18+

cd server
npm install
npm start                # abre http://localhost:4000

Site em server/public: index.html, app.jsx (componente React) e styles.css.
