# Brand logos

Put the official logo files in this folder with exactly these names:

| File | What | Notes |
|---|---|---|
| `lrqa-logo.png` | LRQA logo | The version for **dark/navy backgrounds**, with a transparent background. An SVG would be sharper on a big screen: save it as `lrqa-logo.svg` and update `company.logo` in `web/src/brand.ts`. |
| `douglas-academy-crest.png` | Douglas Academy crest | PNG with a transparent background, ideally at least 300px tall. Ask the school office for it. |

Both files are included. If one goes missing, the app shows the name as plain text in its place. Logos are bundled into the Docker image, so they still work with no internet at the event.

To change the wording (event title, tagline, motto), edit `web/src/brand.ts`. To change the colours and fonts, edit the brand tokens at the top of `web/src/index.css`.
