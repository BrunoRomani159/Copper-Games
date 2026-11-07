const { useEffect, useMemo, useState } = React;

const brl = (n) => n === 0 ? 'Grátis' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const final = (g) => +(g.price * (1 - g.discount / 100)).toFixed(2);
const tones = ['#73030D', '#732F3B', '#8C8C8C', '#5a0209'];
const cover = (g) => {
  const n = [...g.title].reduce((a, c) => a + c.charCodeAt(0), 0);
  return { background: `linear-gradient(${(n * 7) % 180}deg, ${tones[n % 4]}, ${tones[(n + 1) % 4]})` };
};

// Escolhe qual imagem usar em cada lugar da interface
const src = (u) => u ? encodeURI(u) : '';
const wide = (g) => src(g.image2 || g.image3 || g.image);   // banner grande (hero e modal)
const thumbImg = (g) =>                                       // miniatura horizontal (lista e carrinho)
  src([g.image, g.image2, g.image3].find(u => u && /capa_horizontal/.test(u)) || g.image3 || g.image);

// Mostra a imagem; se não existir ou falhar ao carregar, cai no degradê colorido
function Art({ g, img, className, children }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [img]);
  const ok = img && !failed;
  return (
    <div className={className + (ok ? ' has-img' : '')} style={cover(g)}>
      {ok && <img src={img} alt={g.title} loading="lazy" onError={() => setFailed(true)} />}
      {!ok && children}
    </div>
  );
}

function Price({ g }) {
  return (
    <span className="price">
      {g.discount > 0 && <b className="off">-{g.discount}%</b>}
      <span>{g.discount > 0 && <s>{brl(g.price)}</s>}<strong>{brl(final(g))}</strong></span>
    </span>
  );
}

function App() {
  const [games, setGames] = useState([]);
  const [genres, setGenres] = useState([]);
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState('rating');
  const [open, setOpen] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [error, setError] = useState('');
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; }
  });

  useEffect(() => { fetch('/api/genres').then(r => r.json()).then(setGenres).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({ q, genre, sort });
      fetch('/api/games?' + p).then(r => r.json()).then(d => { setGames(d); setError(''); })
        .catch(() => setError('Não consegui falar com o servidor. Verifique se o servidor está rodando (npm start).'));
    }, 200);
    return () => clearTimeout(t);
  }, [q, genre, sort]);
  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart]);

  const featured = useMemo(() => games.find(g => g.featured) || games[0], [games]);
  const total = cart.reduce((s, g) => s + final(g), 0);
  const add = (g) => setCart(c => c.some(x => x._id === g._id) ? c : [...c, g]);
  const inCart = (g) => cart.some(x => x._id === g._id);

  return (
    <>
      <header className="top">
        <a className="logo" href="/">cobre</a>
        <input className="search" placeholder="Buscar jogos" value={q} onChange={e => setQ(e.target.value)} />
        <button className="cartbtn" onClick={() => setCartOpen(true)}>Carrinho ({cart.length})</button>
      </header>

      <div className="layout">
        <nav className="side" aria-label="Gêneros">
          <h2>Gêneros</h2>
          <button className={!genre ? 'on' : ''} onClick={() => setGenre('')}>Todos</button>
          {genres.map(x => <button key={x} className={genre === x ? 'on' : ''} onClick={() => setGenre(x)}>{x}</button>)}
        </nav>

        <main>
          {error && <p className="error">{error}</p>}
          {featured && !q && !genre && (
            <section className="hero" onClick={() => setOpen(featured)}>
              <Art g={featured} img={wide(featured)} className="hero-art"><span>{featured.title}</span></Art>
              <div className="hero-info">
                <h1>{featured.title}</h1>
                <p>{featured.description}</p>
                <div className="tags">{featured.tags.map(t => <i key={t}>{t}</i>)}</div>
                <Price g={featured} />
              </div>
            </section>
          )}

          <div className="bar">
            <h2>{genre || 'Todos os jogos'} <small>{games.length}</small></h2>
            <label>Ordenar por
              <select value={sort} onChange={e => setSort(e.target.value)}>
                <option value="rating">Avaliação</option><option value="new">Lançamento</option>
                <option value="price">Menor preço</option><option value="title">Nome</option>
              </select>
            </label>
          </div>

          <div className="list">
            {games.map(g => (
              <article key={g._id} className="row" onClick={() => setOpen(g)}>
                <Art g={g} img={thumbImg(g)} className="thumb">{g.title.slice(0, 2)}</Art>
                <div className="meta">
                  <h3>{g.title}</h3>
                  <p>{g.genre} · {g.developer}</p>
                  <div className="tags">{g.tags.map(t => <i key={t}>{t}</i>)}</div>
                </div>
                <span className="score">{g.rating}%</span>
                <Price g={g} />
              </article>
            ))}
            {!games.length && !error && <p className="empty">Nenhum jogo encontrado. Tente outro nome ou limpe o filtro de gênero.</p>}
          </div>
        </main>
      </div>

      {open && (
        <div className="overlay" onClick={() => setOpen(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label={open.title}>
            <Art g={open} img={wide(open)} className="modal-art">{open.title}</Art>
            <div className="modal-body">
              <h2>{open.title}</h2>
              <p className="dev">{open.developer} · {open.genre} · {new Date(open.releaseDate).toLocaleDateString('pt-BR')}</p>
              <p>{open.description}</p>
              <p className="dev">{open.rating}% de avaliações positivas</p>
              <div className="buy"><Price g={open} />
                <button className="primary" disabled={inCart(open)} onClick={() => add(open)}>{inCart(open) ? 'No carrinho' : 'Adicionar ao carrinho'}</button>
              </div>
              <button className="link" onClick={() => setOpen(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="overlay" onClick={() => setCartOpen(false)}>
          <aside className="drawer" onClick={e => e.stopPropagation()}>
            <h2>Seu carrinho</h2>
            {!cart.length && <p className="empty">Vazio por enquanto. Escolha um jogo na loja.</p>}
            {cart.map(g => (
              <div key={g._id} className="crow">
                <Art g={g} img={thumbImg(g)} className="thumb sm">{g.title.slice(0, 2)}</Art>
                <span>{g.title}</span><strong>{brl(final(g))}</strong>
                <button className="link" onClick={() => setCart(c => c.filter(x => x._id !== g._id))}>Remover</button>
              </div>
            ))}
            <div className="total"><span>Total</span><strong>{brl(total)}</strong></div>
            <button className="primary" disabled={!cart.length}>Finalizar compra</button>
            <button className="link" onClick={() => setCartOpen(false)}>Continuar comprando</button>
          </aside>
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
