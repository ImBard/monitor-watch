# Monitor Watch

Site estático para acompanhar preços de monitores de 27", 29", 32" e 34", priorizando qualidade de imagem e conforto visual para MacBook, programação, leitura e trabalho.

## Estrutura

- `index.html` — página principal
- `styles.css` — visual/responsividade
- `app.js` — renderização, filtros, ordenação e gráficos
- `data.json` — **único arquivo que precisa ser atualizado a cada pesquisa**
- `.nojekyll` — evita processamento desnecessário no GitHub Pages

## Rodar localmente

Por causa do `fetch("data.json")`, abra com um servidor local em vez de clicar direto no HTML.

### Python
```bash
cd monitor-watch
python3 -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. Abra **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione `main` e `/ (root)`.
6. Salve.

O site ficará em algo parecido com:

```text
https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
```

## Atualização automática

O arquivo `data.json` foi pensado para ser sobrescrito pelas pesquisas das 10h e 18h.

Depois que o repositório estiver no GitHub, envie ao ChatGPT o nome no formato:

```text
usuario/repositorio
```

Assim o agendamento pode ser ajustado para atualizar o `data.json` automaticamente após cada pesquisa.

## Campos principais do data.json

- `updatedAt`
- `headline`
- `monitors[].price`
- `monitors[].previousPrice`
- `monitors[].lowestPrice`
- `monitors[].average30d`
- `monitors[].store`
- `monitors[].url`
- `monitors[].history`

Os links de oferta no exemplo estão como `"#"` de propósito. O processo automático deve substituir por URLs reais.
