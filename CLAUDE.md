# MC Industrial — App de Inspeção de Qualidade

SPA em React 19 + TypeScript + Vite 6, usado internamente para controle de qualidade
(inspeções de material, fornecedores, relatórios). Backend/auth via Supabase.

## Stack e comandos

- `npm run dev` — servidor local (porta 3000, `base: '/'` no `vite.config.ts`)
- `npm run build` — build de produção (`dist/`)
- Tailwind CSS v3.4 + PostCSS + autoprefixer (build-time — **não** é mais CDN)
- Recharts 3.x para gráficos
- `@supabase/supabase-js` para dados/autenticação

## Deploy

- Produção: **GitHub Pages** via GitHub Actions (`.github/workflows/deploy.yml`),
  dispara em todo push pra `main`.
- Domínio próprio: **qc-lyon.com.br** (CNAME em `public/CNAME`, copiado pro build).
  Se precisar reconfigurar: o campo "Custom domain" em Settings → Pages do repo
  **não é preenchido automaticamente** pelo arquivo CNAME quando o deploy é via
  Actions — precisa digitar o domínio manualmente ali e clicar Save.
- Fluxo de branch: desenvolve em `claude/gallant-knuth-nj299y`, depois
  `git merge --ff-only` pra `main` e push (main é o gatilho do deploy).
- Contexto do domínio: o app já foi bloqueado pelo Cisco Umbrella (rede da Vale)
  quando hospedado em domínios compartilhados (`vercel.app`, depois `github.io`).
  Por isso o domínio próprio — evite reintroduzir dependência de subdomínio
  compartilhado sem avisar o usuário.

## Sistema de tema (claro/escuro) — IMPORTANTE

O tema é controlado por `html.theme-light` / `html.theme-dark` (ver `App.tsx`,
toggle em `Header.tsx`, persistido em `localStorage.app_theme`). A adaptação
de cor **não** é feita por lógica React — é um sistema de overrides CSS em
`index.css` que reconhece *padrões literais específicos* de classe/inline-style
e os substitui via `!important`. Isso significa:

- Componentes no estilo "premium dark" (cards translúcidos, usado em
  Dashboard/Reports/Materials/Settings/UserManagement) usam
  `style={{ background: 'rgba(10, 12, 18, 0.85)', border: '1px solid rgba(255,255,255,0.1)' }}`.
  O CSS reconhece a substring literal `rgba(10, 12, 18` (ou `rgba(13, 20, 33`)
  dentro do atributo `style` e troca pra cartão branco no tema claro.
  **Se você usar qualquer outra cor hex/rgba pra esse fundo (ex: `#090B12`),
  ela não será reconhecida e o card fica preso no escuro mesmo no tema claro.**
  Já aconteceu isso no modal de detalhes de `Reports.tsx` — troque sempre para
  um dos padrões já cobertos em `index.css` (procure por `theme-light` lá).
- Classes Tailwind cobertas automaticamente: `bg-white`, `bg-slate-50/100/900`,
  `bg-white/[0.02..0.10]`, `text-white`, `text-slate-900/800/700/600/500/400`,
  `border-white/[0.06..0.20]`, `border-slate-50/100/200`. Prefira essas classes
  em vez de cores arbitrárias sempre que possível.
- Cores de status/accent (verde/vermelho/âmbar em baixa opacidade pra
  aprovado/rejeitado/pendente) não precisam de tratamento especial — ficam
  legíveis nos dois temas por já serem translúcidas.

## Gotchas conhecidas

- **Dependência `xlsx`**: `package.json` aponta pra
  `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`, que pode estar
  bloqueada em sandboxes sem acesso irrestrito à rede. Se `npm install` falhar
  por causa dela, remova a linha temporariamente, rode o install, e depois
  `git checkout -- package.json` pra restaurar (o GitHub Actions tem acesso
  normal à rede, então o deploy real nunca é afetado).
- **Recharts — Tooltip entre gráficos**: montar `<Tooltip>` dentro de um
  `<PieChart>` ao mesmo tempo que outros gráficos (`BarChart`/`ComposedChart`)
  com seus próprios `<Tooltip>` na mesma página quebra a ativação do tooltip
  em TODOS os gráficos da página (bug reproduzido em recharts v2 e v3). Fix
  usado no Dashboard: manter o `<Pie>` real pra visual, mas sem `<Tooltip>`
  próprio — usar uma div flutuante controlada por `onMouseMove` no lugar.
- **Ícones "quebrados" em sandbox**: se o Google Fonts estiver bloqueado,
  `material-symbols-rounded` renderiza como texto literal (ex: "warning",
  "close"). Isso é só artefato do ambiente de teste, não um bug real.
- **Testando localmente sem Supabase**: crie um `.env.local` (não versionado)
  com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` fake (ex:
  `https://placeholder.supabase.co`) pra evitar crash no boot. Pra navegar
  sem login de verdade, App.tsx pode receber hooks de teste temporários:
  ```tsx
  const [inspections, setInspections] = useState<Inspection[]>(() => (window as any).__TEST_INSPECTIONS__ || []);
  const [currentView, setCurrentView] = useState<View>(() => (window as any).__TEST_VIEW__ || View.DASHBOARD);
  const [userProfile, setUserProfile] = useState<UserProfile>((window as any).__TEST_PROFILE__ || {...});
  // guard: if (!session && !(window as any).__TEST_SKIP_LOGIN__) { return <Login />; }
  ```
  **Sempre reverter esses hooks (`git checkout -- App.tsx`) antes de commitar.**

## Preferências do usuário

- Comunicação e commits em português.
- Fluxo esperado: implementar → validar (tsc + build + teste visual em claro
  e escuro) → commit na branch de dev → merge `--ff-only` pra `main` → push
  (dispara deploy) → avisar o usuário com o link do GitHub Actions.
- O usuário testa no site publicado (produção), não local — por isso todo
  fix pequeno deve ir até o deploy, não só ficar commitado.
