# IUB All In One Portal — Web App

## Structure
```
iub-webapp/
├── index.html    # Markup only
├── styles.css    # All styling (theme: navy #16234F + gold #F0B429)
├── app.js        # Quick Links data, banner rotation, search, settings panel
└── assets/       # Empty — drop logo, icons, images here
```

## Notes
- No build step required — open `index.html` directly in a browser, or serve the folder with any static server.
- Google Fonts (Poppins) is loaded via CDN link in `index.html`. Swap for a local font file in `assets/` if you need it to work offline.
- All icons are inline SVG in `app.js` — no image assets required for the current UI, but `assets/` is ready for your logo, app icon, and banner images once you provide them.
- Quick Links, banner slides, and portal names are placeholder data in `app.js` — swap in real portal URLs and content when ready.
