const fs = require('fs');
let css = fs.readFileSync('css/act2-screen.css', 'utf8');
css = css.replace(
  /\.act2-check-tech-line \.act2-phone-line-who \{\n  color: var\(--palette-teal\);\n\}\n\n\.act2-check-tech-line \.act2-phone-line-text \{\n  color: var\(--palette-text-dark\);\n  font-size: 1.08rem;\n\}/,
  `.act2-check-tech-line .act2-phone-line-who {
  color: #0369A1; /* Use info-strong or teal */
  font-family: var(--font-family-display);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
  display: block;
}
.act2-check-tech-line .act2-phone-line-text {
  color: var(--palette-text-dark);
  font-family: 'Outfit', sans-serif;
  font-size: 1.06rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin: 0;
}
.act2-check-callie-line {
  border-left: 4px solid var(--palette-brown-dark);
  padding-left: 0.9rem;
  margin-bottom: 1rem;
}
.act2-check-callie-line .act2-phone-line-who {
  color: var(--palette-teal-dark);
  font-family: var(--font-family-display);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
  display: block;
}
.act2-check-callie-line .act2-phone-line-text {
  color: var(--palette-brown-dark);
  font-family: var(--font-family-display);
  font-weight: 600;
  font-size: 1.08rem;
  margin: 0;
}`
);
fs.writeFileSync('css/act2-screen.css', css);
