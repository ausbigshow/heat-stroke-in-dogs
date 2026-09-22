const fs = require('fs');

let js = fs.readFileSync('js/act2-screen.js', 'utf8');

// Replace name check techResponse
js = js.replace(
  /techResponse: "Okay\. I have everything I need from you\."/,
  `techResponse: "A slow answer to her own name is not her being tired. That's heat reaching the brain, and it shows up before anything else looks wrong."`
);

// Add getCallieReportLine
const getCallieCode = `
  getCallieReportLine(checkId, v) {
    const s = Math.max(0, Math.min(1, this.severity));
    if (checkId === 'gums') {
      if (s < 0.72) return \`They're brick red. And tacky, they stick to my thumb. I pressed and counted - \${v.refillSeconds} seconds before the colour came back. That's slow, isn't it.\`;
      return \`They've gone dull. Grey around the edges. I pressed and counted - \${v.refillSeconds} seconds before any colour came back at all.\`;
    }
    if (checkId === 'ears') {
      if (s < 0.72) return \`Hot. Really hot. I'm going right round the edges and there's no cool spot anywhere on her.\`;
      return \`Hot, and the skin inside feels dry. I'm going right round the edges and there's no cool spot anywhere on her.\`;
    }
    if (checkId === 'panting') {
      if (s < 0.72) return \`Fast. Fast and shallow - about \${v.pantRate} in a minute. And she never closes her mouth. Not once in fifteen seconds.\`;
      return \`Fast and shallow, about \${v.pantRate} in a minute, and there's a noise at the back of her throat that wasn't there before. She never closes her mouth.\`;
    }
    if (checkId === 'name') {
      if (s < 0.72) return \`Tay. Tay. ... \${v.responseSeconds} seconds. Her eye moved. That's all. Her head didn't come up.\`;
      return \`Tay. Tay. ... Nothing. Not her eye, not her ear, not her tail. \${v.responseSeconds} seconds and nothing.\`;
    }
    return '';
  }

  buildCheckSteps`;

js = js.replace(/buildCheckSteps/g, 'buildCheckSteps_TEMP');
js = js.replace(/buildCheckSteps_TEMP/, getCallieCode);
js = js.replace(/buildCheckSteps_TEMP/g, 'buildCheckSteps');

// Rewrite buildCheckSteps
js = js.replace(
  /buildCheckSteps\(checkId\) \{[\s\S]*?return \[[\s\S]*?\];\s*\}/,
  `buildCheckSteps(checkId) {
    const check = this.checksData[checkId];
    if (!check) return [];
    return [
      { type: 'prompt', text: check.techPrompt },
      { type: 'observe' },
      { type: 'report' },
      { type: 'response', text: check.techResponse }
    ];
  }`
);

// Rewrite getCheckBodyHtml
js = js.replace(
  /getCheckBodyHtml\(checkId, step\) \{[\s\S]*?return '';\s*\}/,
  `getCheckBodyHtml(checkId, stepIndex) {
    const v = this.getVitals();
    const artByCheck = {
      gums: (conv) => this.renderGumArt(v, conv),
      ears: (conv) => this.renderEarArt(v, conv),
      panting: (conv) => this.renderPantingArt(v, conv),
      name: (conv) => this.renderNameArt(v, conv)
    };

    const steps = this.buildCheckSteps(checkId);
    let convHtml = '';
    
    for (let i = 0; i <= stepIndex; i++) {
      const step = steps[i];
      const stepKey = \`\${this.currentBeat}-\${checkId}-\${i}\`;
      const isNew = (i === stepIndex) && (this._renderedStep !== null) && (this._renderedStep !== stepKey);
      const isNewLineClass = isNew ? 'is-new-line' : '';
      
      if (step.type === 'prompt' || step.type === 'response') {
        convHtml += \`
          <div class="act2-check-tech-line \${isNewLineClass}" data-editor-id="act2-check-tech-line-\${i}">
            <span class="act2-phone-line-who">
              <span aria-hidden="true">⚡ 📱</span> Dana · Lakeside Emergency (Phone)
            </span>
            <p class="act2-phone-line-text">"\${step.text}"</p>
          </div>
        \`;
      } else if (step.type === 'report') {
        convHtml += \`
          <div class="act2-check-callie-line \${isNewLineClass}" data-editor-id="act2-check-callie-line-\${i}">
            <span class="act2-phone-line-who">
              <span aria-hidden="true">👩</span> Callie
            </span>
            <p class="act2-phone-line-text">"\${this.getCallieReportLine(checkId, v)}"</p>
          </div>
        \`;
      }
    }
    
    return artByCheck[checkId](convHtml);
  }`
);

// We must also update references calling getCheckBodyHtml to pass stepIndex instead of step!
js = js.replace(/this\.getCheckBodyHtml\(this\.activeCheckId, step\)/g, 'this.getCheckBodyHtml(this.activeCheckId, idx)');
// Wait, in nextCheckStep it's checkStepIndex.
js = js.replace(/this\.getCheckBodyHtml\(this\.activeCheckId, step\)/g, 'this.getCheckBodyHtml(this.activeCheckId, this.checkStepIndex)');
// Let's do a more robust replace for getCheckBodyHtml usages.
// renderCheckActive uses idx. nextCheckStep uses this.checkStepIndex.
// So let's replace `this.getCheckBodyHtml(this.activeCheckId, step)` with `this.getCheckBodyHtml(this.activeCheckId, idx)` in renderCheckActive 
// and `this.getCheckBodyHtml(this.activeCheckId, this.checkStepIndex)` in nextCheckStep.

fs.writeFileSync('js/act2-screen.js', js);
