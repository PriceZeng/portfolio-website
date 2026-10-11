# zengdigital.com

Portfolio of Lingchen Zeng. Hosted on Cloudflare; every change pushed to `main` goes live automatically.

## Editing the site (no code)

All words, images, links and projects live in two files:

| File | What's in it |
|---|---|
| `content/site.json` | Name, subtitle, keyword animation, artist statement, menu prompt, email, social links |
| `content/projects.json` | Every project: menu button, layout, text, photos, slideshows, buttons, videos |

You edit them through **Pages CMS**, a free visual editor for GitHub:

1. Go to **https://app.pagescms.org** and sign in with GitHub.
2. Pick the `portfolio-website` repository (first time only: allow access when asked).
3. Choose **Projects** or **Home page & contact** in the sidebar, edit, and press **Save**.
4. The site updates in about a minute.

### Common tasks

- **Add a photo to the slideshow** — Projects → Photography Showcase → Slideshow → *Add an entry* → upload the photo and type a caption. Numbers (01 //, 02 //…) are added for you. Drag entries to reorder.
- **Add a new project** — Projects → *Add an entry* at the bottom. Give it a menu label, icon and layout, then fill in only the sections you need; empty sections are simply not shown. Use **Hide this project** to take something offline without deleting it.
- **Add a video** — paste a normal YouTube, Bilibili, Vimeo or Google Drive share link into the *Video* field. It's converted into a player automatically.
- **Italic / bold** — in any paragraph, write `*like this*` for italic or `**like this**` for bold.
- **Link straight to a project** — share `https://zengdigital.com/#photography-showcase` (the part after `#` is the menu label in lowercase with dashes). It skips the intro and opens that project.

### Uploading big files is fine

You can upload photos straight from the camera. A GitHub Action (`.github/workflows/optimize-media.yml`) runs after each save and:

- converts JPG/PNG to WebP, max 2000 px — usually 95%+ smaller with no visible difference,
- turns large GIFs into MP4s,
- re-encodes videos over 5 MB to 1080p,

then updates the content files to point to the new versions. Leave it a minute or two after uploading.

## Developer notes

- `index.html` is a shell; `js/site.js` builds the menu and project pages from `content/*.json`.
- `.pages.yml` defines the editing forms in Pages CMS.
- `.assetsignore` keeps config files off the public site.
- To preview locally, serve the folder (e.g. `npx serve .` or `python3 -m http.server`) — opening `index.html` directly won't load the content files.
