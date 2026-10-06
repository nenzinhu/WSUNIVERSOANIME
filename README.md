# Universo Estampado (WS)

Vitrine de camisetas e moletons personalizados de animes, desenhos, live action e games.
Catálogo conceitual — preços, prazos e atendimento são confirmados fora do site.

**Proprietário do site: Willian Cesar da Silva**

## Deploy no Vercel

1. Importe este repositório no Vercel.
2. Framework preset: **Other** (site estático, sem build).
3. Diretório de saída: a raiz do repositório (padrão) — o `index.html` já está aqui.

Nenhuma variável de ambiente ou dependência é necessária.

## Estrutura

- `index.html` — página única
- `style.css` — estilo base / vitrine
- `anime.css` — identidade anime (roxo, lime e fundo `assets/anime-multiverso.png`)
- `app.js` — catálogo, filtros, sacola e diálogos
- `anime.js` — animações GSAP 3.15.0
- `vendor/` — GSAP local: ScrollTrigger, ScrollToPlugin, SplitText e Flip
- `assets/` — imagens (fundo, mockups e logo WS)

## Animações (GSAP)

Entrada da capa com títulos divididos em caracteres, parallax de fundo e do mouse,
flutuação das peças, revelação por linhas com máscara, FLIP nos filtros do catálogo,
skew do ticker pela velocidade da rolagem, botões magnéticos, link ativo no menu e
abertura dos diálogos. Botão "Pausar animações" no cabeçalho (preferência gravada em
localStorage) e respeito a `prefers-reduced-motion`; o catálogo funciona mesmo sem GSAP.
