import 'dotenv/config';
import mongoose from 'mongoose';
import Game from './models/Game.js';

const g = (title, developer, genre, tags, price, discount, rating, date, description, featured = false) =>
  ({ title, developer, genre, tags, price, discount, rating, releaseDate: date, description, featured });

const games = [
  g('Ferrugem', 'Oficina Cobre', 'RPG', ['mundo aberto', 'pós-apocalíptico'], 119.9, 25, 91, '2025-03-14', 'Atravesse um deserto de máquinas enferrujadas e decida quem merece religar a última usina da região.', true),
  g('Maré Baixa', 'Estúdio Pirarucu', 'Aventura', ['narrativa', 'exploração'], 59.9, 0, 88, '2024-11-02', 'Um faroleiro, uma cidade que some a cada maré e doze dias para entender por quê.'),
  g('Cinzel', 'Pedra & Pixel', 'Estratégia', ['construção', 'medieval'], 79.9, 40, 84, '2024-06-20', 'Erga uma catedral por gerações, equilibrando fé, impostos e a paciência dos pedreiros.'),
  g('Vértice 9', 'Núcleo Zero', 'Ação', ['tiro', 'cooperativo'], 99.9, 0, 79, '2025-08-01', 'Quatro operadores, uma estação orbital em queda e nenhum plano B.'),
  g('Bordado', 'Linha Fina', 'Puzzle', ['relaxante', 'arte'], 24.9, 10, 93, '2023-09-12', 'Resolva padrões de ponto cruz que contam a história de uma família de costureiras.'),
  g('Asfalto Quente', 'Marcha Lenta', 'Corrida', ['arcade', 'multiplayer'], 69.9, 50, 76, '2024-02-27', 'Racha de rua em cidades litorâneas, com carros que você monta peça por peça.'),
  g('Lanterna Rubra', 'Oficina Cobre', 'Terror', ['atmosférico', 'furtivo'], 49.9, 0, 86, '2025-10-31', 'Uma mina abandonada, uma lanterna com pouca bateria e algo que respeita a luz.'),
  g('Quórum', 'Mesa Redonda', 'Estratégia', ['política', 'turnos'], 39.9, 30, 81, '2024-04-05', 'Negocie votos em uma assembleia onde ninguém é totalmente honesto.'),
  g('Salto Fino', 'Pedra & Pixel', 'Plataforma', ['precisão', 'pixel art'], 29.9, 0, 90, '2023-12-08', 'Plataforma difícil e justa, com checkpoints a cada respiro.'),
  g('Fronteira 44', 'Núcleo Zero', 'Simulação', ['sobrevivência', 'gestão'], 89.9, 15, 83, '2025-05-22', 'Administre um posto isolado de fronteira durante o inverno mais longo em décadas.'),
  g('Cadência', 'Estúdio Pirarucu', 'Ritmo', ['música', 'indie'], 34.9, 20, 87, '2024-08-16', 'Um jogo de ritmo onde cada fase é uma gravação ao vivo em um bar de Joinville.'),
  g('Veredas', 'Linha Fina', 'Aventura', ['cooperativo', 'exploração'], 54.9, 0, 85, '2025-01-30', 'Dois viajantes, um sertão que muda de lugar e um mapa que só funciona a dois.'),
];

await mongoose.connect(process.env.MONGO_URI);
await Game.deleteMany({});
await Game.insertMany(games);
console.log(`${games.length} jogos inseridos`);
await mongoose.disconnect();
