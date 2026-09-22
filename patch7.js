const fs = require('fs');
let js = fs.readFileSync('js/act2-screen.js', 'utf8');

js = js.replace(/counted - \$\{v\.refillSeconds\}/g, 'counted — ${v.refillSeconds}');
js = js.replace(/shallow - about \$\{v\.pantRate\}/g, 'shallow — about ${v.pantRate}');
js = js.replace(/seconds - nothing/g, 'seconds — nothing'); // wait, the copy said "seconds and nothing."

fs.writeFileSync('js/act2-screen.js', js);
