const fs = require('fs');

let js = fs.readFileSync('js/act2-screen.js', 'utf8');

js = js.replace(
  /\/\/ Patch the beat dots/,
  `// Scroll the conversation to the bottom so the newest line is in view
      const conv = this.container.querySelector('.act2-check-conversation');
      if (conv) {
        // Use requestAnimationFrame to ensure the DOM has updated and rendered
        requestAnimationFrame(() => {
          conv.scrollTop = conv.scrollHeight;
        });
      }

      // Patch the beat dots`
);

fs.writeFileSync('js/act2-screen.js', js);
