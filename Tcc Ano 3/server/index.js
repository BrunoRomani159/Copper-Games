import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { games as initialGames } from './games-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Banco em memória (sem MongoDB) ---
let games = [...initialGames];
let nextId = initialGames.length + 1;

const sorts = {
  new:   { field: 'releaseDate', dir: -1 },
  rating:{ field: 'rating',      dir: -1 },
  price: { field: 'price',       dir:  1 },
  title: { field: 'title',       dir:  1 },
};

function compare(a, b, s) {
  let va = a[s.field], vb = b[s.field];
  if (typeof va === 'string') va = va.toLowerCase();
  if (typeof vb === 'string') vb = vb.toLowerCase();
  if (va < vb) return -s.dir;
  if (va > vb) return  s.dir;
  return 0;
}

// Lista jogos (com filtro por gênero, busca por título e ordenação)
app.get('/api/games', (req, res) => {
  const { q, genre, sort = 'rating' } = req.query;
  let result = games.filter(g => {
    if (genre && g.genre !== genre) return false;
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      return re.test(g.title);
    }
    return true;
  });
  const s = sorts[sort] || sorts.rating;
  result = [...result].sort((a, b) => compare(a, b, s));
  res.json(result);
});

// Gêneros disponíveis
app.get('/api/genres', (_req, res) => {
  const genres = [...new Set(games.map(g => g.genre))].sort();
  res.json(genres);
});

// Um jogo pelo id
app.get('/api/games/:id', (req, res) => {
  const game = games.find(g => g._id === req.params.id);
  game ? res.json(game) : res.status(404).json({ error: 'Jogo não encontrado' });
});

// Cadastra um novo jogo
app.post('/api/games', (req, res) => {
  try {
    const game = {
      _id: 'g' + nextId++,
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    games.push(game);
    res.status(201).json(game);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 4000, () => console.log('API na porta', process.env.PORT || 4000));
