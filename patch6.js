const fs = require('fs');
let js = fs.readFileSync('js/act2-screen.js', 'utf8');

js = js.replace(
  /const dialog = this\.container\?\.querySelector\('\[role="dialog"\]'\);\s*if \(dialog\) containFocusIn\(dialog\);/,
  `const dialog = this.container?.querySelector('[role="dialog"]');
    if (dialog) containFocusIn(dialog);
    const conv = this.container?.querySelector('.act2-check-conversation');
    if (conv) {
      requestAnimationFrame(() => {
        conv.scrollTop = conv.scrollHeight;
      });
    }`
);

fs.writeFileSync('js/act2-screen.js', js);
