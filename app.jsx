const { useEffect, useMemo, useState } = React;

const brl = (n) => n === 0 ? 'Grátis' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const final = (g) => g.finalPrice ?? +(g.price * (1 - g.discount / 100)).toFixed(2);
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

// Página inicial (vitrine) — aparece antes da loja
function useCountdown(iso) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const s = Math.max(0, Math.floor((new Date(iso) - now) / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
}

function Countdown({ iso, label = 'Termina em' }) {
  const t = useCountdown(iso);
  const p = (n) => String(n).padStart(2, '0');
  return (
    <div className="count" aria-label={label}>
      <small>{label}</small>
      {[['d', t.d], ['h', t.h], ['m', t.m], ['s', t.s]].map(([k, v]) => <span key={k}><b>{p(v)}</b>{k}</span>)}
    </div>
  );
}

function Home({ onOpen, onAdd, inCart }) {
  const [games, setGames] = useState([]);
  const [promos, setPromos] = useState([]);
  const [slide, setSlide] = useState(0);
  const [pause, setPause] = useState(false);
  const rail = React.useRef(null);

  useEffect(() => {
    setGames(API.games({ sort: 'rating' }));
    setPromos(API.promos());
  }, []);
  useEffect(() => {
    if (pause || promos.length < 2) return;
    const t = setInterval(() => setSlide(s => (s + 1) % promos.length), 6000);
    return () => clearInterval(t);
  }, [pause, promos.length]);

  const byId = (id) => games.find(g => g._id === id);
  const promoGames = (p) => p.gameIds.map(byId).filter(Boolean).sort((a, b) => b.rating - a.rating);
  const onSale = useMemo(() => games.filter(g => g.discount > 0).sort((a, b) => b.discount - a.discount || b.rating - a.rating), [games]);
  const free = useMemo(() => games.filter(g => g.price === 0).sort((a, b) => b.players - a.players).slice(0, 8), [games]);
  const top = useMemo(() => [...games].sort((a, b) => b.players - a.players).slice(0, 5), [games]);
  const genres = useMemo(() => {
    const m = {};
    games.forEach(g => (m[g.genre] = m[g.genre] || []).push(g));
    return Object.entries(m).sort((a, b) => b[1].length - a[1].length).slice(0, 6)
      .map(([name, list]) => ({ name, count: list.length, art: [...list].sort((a, b) => b.players - a.players)[0] }));
  }, [games]);
  const best = onSale[0];
  const cur = promos[slide];
  const curGames = cur ? promoGames(cur).slice(0, 3) : [];
  const heroImg = cur && curGames[0] ? wide(curGames[0]) : '';
  const scroll = (dx) => rail.current && rail.current.scrollBy({ left: dx, behavior: 'smooth' });

  return (
    <div className="home">
      {cur && (
        <section className="stage" style={{ '--c': cur.color }} onMouseEnter={() => setPause(true)} onMouseLeave={() => setPause(false)}>
          {heroImg && <img key={heroImg} className="stage-bg" src={heroImg} alt="" />}
          <div className="stage-shade" />
          <div className="stage-in">
            <div className="stage-text" key={cur.id}>
              <span className="pill">Promoção</span>
              <h1>{cur.name}</h1>
              <p>{cur.tagline}</p>
              <div className="stage-off"><b>-{cur.discount}%</b><span>em {cur.gameIds.length} jogos</span></div>
              <Countdown iso={cur.endsAt} />
              <a className="cta" href={'#/loja?promo=' + cur.id}>Ver jogos em promoção →</a>
            </div>
            <div className="stage-picks">
              {curGames.map(g => (
                <button key={g._id} className="pick" onClick={() => onOpen(g)}>
                  <Art g={g} img={src(g.image)} className="pick-art">{g.title.slice(0, 2)}</Art>
                  <span className="pick-t">{g.title}</span>
                  <span className="pick-p"><s>{brl(g.price)}</s> <b>{brl(final(g))}</b></span>
                </button>
              ))}
            </div>
          </div>
          <div className="dots">
            {promos.map((p, i) => <button key={p.id} className={i === slide ? 'on' : ''} onClick={() => setSlide(i)} aria-label={p.name}><i /></button>)}
          </div>
        </section>
      )}

      <section className="strip">
        <div><b>{games.length}</b><span>jogos no catálogo</span></div>
        <div><b>{onSale.length}</b><span>em promoção agora</span></div>
        <div><b>{games.filter(g => g.price === 0).length}</b><span>para jogar de graça</span></div>
        <div><b>até -{best ? best.discount : 0}%</b><span>maior desconto</span></div>
      </section>

      <section className="block">
        <header className="bh"><h2>Promoções ativas</h2><a href="#/loja?promo=all">Ver todas as ofertas</a></header>
        <div className="promo-grid">
          {promos.map(p => {
            const pg = promoGames(p);
            return (
              <a key={p.id} className="promo" href={'#/loja?promo=' + p.id} style={{ '--c': p.color }}>
                <div className="mosaic">
                  {pg.slice(0, 3).map(g => <Art key={g._id} g={g} img={src(g.image)} className="m">{g.title.slice(0, 2)}</Art>)}
                </div>
                <div className="promo-body">
                  <b className="bigoff">-{p.discount}%</b>
                  <h3>{p.name}</h3>
                  <p>{p.tagline}</p>
                  <Countdown iso={p.endsAt} label="Acaba em" />
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <section className="block">
        <header className="bh">
          <h2>Ofertas imperdíveis</h2>
          <div className="arrows"><button onClick={() => scroll(-600)} aria-label="Anterior">‹</button><button onClick={() => scroll(600)} aria-label="Próximo">›</button></div>
        </header>
        <div className="rail" ref={rail}>
          {onSale.map(g => (
            <article key={g._id} className="card" onClick={() => onOpen(g)}>
              <Art g={g} img={src(g.image)} className="card-art">{g.title}</Art>
              <b className="badge">-{g.discount}%</b>
              <div className="card-b">
                <h3>{g.title}</h3>
                <div className="card-p"><s>{brl(g.price)}</s><strong>{brl(final(g))}</strong></div>
                <button className="mini" disabled={inCart(g)} onClick={(e) => { e.stopPropagation(); onAdd(g); }}>{inCart(g) ? 'No carrinho ✓' : 'Adicionar'}</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="block two">
        <div>
          <header className="bh"><h2>Jogue de graça</h2><a href="#/loja">Ver loja</a></header>
          <div className="free-grid">
            {free.map(g => (
              <article key={g._id} className="free" onClick={() => onOpen(g)}>
                <Art g={g} img={thumbImg(g)} className="free-art">{g.title.slice(0, 2)}</Art>
                <h3>{g.title}</h3><span>{g.genre}</span><em>Grátis</em>
              </article>
            ))}
          </div>
        </div>
        <div>
          <header className="bh"><h2>Mais jogados agora</h2></header>
          <ol className="toplist">
            {top.map((g, i) => (
              <li key={g._id} onClick={() => onOpen(g)}>
                <b>{i + 1}</b><Art g={g} img={thumbImg(g)} className="top-art">{g.title.slice(0, 2)}</Art>
                <span><strong>{g.title}</strong><small>{g.players.toLocaleString('pt-BR')} jogando</small></span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="block">
        <header className="bh"><h2>Explore por gênero</h2></header>
        <div className="genres">
          {genres.map(x => (
            <a key={x.name} className="gtile" href={'#/loja?genre=' + encodeURIComponent(x.name)}>
              <Art g={x.art} img={wide(x.art)} className="gt-art">{x.name}</Art>
              <span><strong>{x.name}</strong><small>{x.count} jogos</small></span>
            </a>
          ))}
        </div>
      </section>

      <section className="finale">
        <img className="finale-logo" src="logo.png" alt="cooper-games" />
        <h2>Pronto para o próximo jogo?</h2>
        <p>Veja o catálogo completo, filtre por gênero e aproveite os descontos antes que acabem.</p>
        <a className="cta" href="#/loja">Entrar na loja →</a>
      </section>
      <footer className="foot"><b className="foot-logo"><img src="logo.png" alt="" />cooper-games</b><span>Projeto TCC · Imagens pertencem aos respectivos detentores de direitos.</span></footer>
    </div>
  );
}

function App() {
  const [games, setGames] = useState([]);
  const [genres, setGenres] = useState([]);
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('');
  const [promo, setPromo] = useState('');
  const [promoList, setPromoList] = useState([]);
  const parseHash = () => {
    const [path, qs = ''] = location.hash.replace(/^#/, '').split('?');
    const p = new URLSearchParams(qs);
    return { route: path.startsWith('/loja') ? 'loja' : 'home', promo: p.get('promo') || '', genre: p.get('genre') || '' };
  };
  const [route, setRoute] = useState(parseHash().route);
  useEffect(() => {
    const sync = () => { const h = parseHash(); setRoute(h.route); setPromo(h.promo); setGenre(h.genre); window.scrollTo(0, 0); };
    sync(); window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => { setPromoList(API.promos()); }, []);
  const [sort, setSort] = useState('rating');
  const [open, setOpen] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [error, setError] = useState('');
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; }
  });

  useEffect(() => { setGenres(API.genres()); }, []);
  useEffect(() => { setGames(API.games({ q, genre, sort, promo })); setError(''); }, [q, genre, sort, promo]);
  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart]);

  const featured = useMemo(() => games.find(g => g.featured) || games[0], [games]);
  const goStore = (v) => { setQ(v); if (route !== 'loja') location.hash = '#/loja'; };
  const total = cart.reduce((s, g) => s + final(g), 0);
  const add = (g) => setCart(c => c.some(x => x._id === g._id) ? c : [...c, g]);
  const inCart = (g) => cart.some(x => x._id === g._id);

  return (
    <>
      <header className="top">
        <a className="logo" href="#/"><img src="logo.png" alt="" />cooper-games</a>
        <nav className="topnav">
          <a href="#/" className={route === 'home' ? 'on' : ''}>Início</a>
          <a href="#/loja" className={route === 'loja' && !promo ? 'on' : ''}>Loja</a>
          <a href="#/loja?promo=all" className={promo ? 'on hot' : 'hot'}>Ofertas</a>
        </nav>
        <input className="search" placeholder="Buscar jogos" value={q} onChange={e => goStore(e.target.value)} />
        <button className="cartbtn" onClick={() => setCartOpen(true)}>Carrinho ({cart.length})</button>
      </header>

      {route === 'home' ? <Home onOpen={setOpen} onAdd={add} inCart={inCart} /> : (
      <div className="layout">
        <nav className="side" aria-label="Gêneros">
          <h2>Gêneros</h2>
          <button className={!genre ? 'on' : ''} onClick={() => { location.hash = '#/loja'; }}>Todos</button>
          {genres.map(x => <button key={x} className={genre === x ? 'on' : ''} onClick={() => { location.hash = '#/loja?genre=' + encodeURIComponent(x); }}>{x}</button>)}
        </nav>

        <main>
          {error && <p className="error">{error}</p>}
          <div className="chips">
            <a className={!promo ? 'on' : ''} href="#/loja">Todos</a>
            <a className={promo === 'all' ? 'on' : ''} href="#/loja?promo=all">🔥 Em promoção</a>
            {promoList.map(p => <a key={p.id} className={promo === p.id ? 'on' : ''} href={'#/loja?promo=' + p.id}>{p.name}</a>)}
          </div>
          {featured && !q && !genre && !promo && (
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
            <h2>{promo ? (promoList.find(p => p.id === promo)?.name || 'Em promoção') : (genre || 'Todos os jogos')} <small>{games.length}</small></h2>
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
                  <p>{g.genre}{g.developer && ' · ' + g.developer}</p>
                  {g.promoName && <span className="promotag">{g.promoName}</span>}
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
      )}

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
        <div className="overlay" onClick={() => { setCartOpen(false); setThanks(false); }}>
          <aside className="drawer" onClick={e => e.stopPropagation()}>
            {thanks ? (
              <div className="thanks">
                <span>✓</span>
                <h2>Obrigado por comprar conosco!</h2>
                <button className="primary" onClick={() => { setThanks(false); setCartOpen(false); }}>Voltar à loja</button>
              </div>
            ) : (<>
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
            <button className="primary" disabled={!cart.length} onClick={() => { setCart([]); setThanks(true); }}>Finalizar compra</button>
            <button className="link" onClick={() => setCartOpen(false)}>Continuar comprando</button>
            </>)}
            </aside>
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);