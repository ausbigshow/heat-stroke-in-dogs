const fs = require('fs');
let js = fs.readFileSync('js/act2-screen.js', 'utf8');
js = js.replace(/this\.getCheckBodyHtml\(this\.activeCheckId, idx\);/g, 'this.getCheckBodyHtml(this.activeCheckId, this.checkStepIndex);');
// In renderCheckActive it should be idx, let's verify renderCheckActive.
fs.writeFileSync('js/act2-screen.js', js);
