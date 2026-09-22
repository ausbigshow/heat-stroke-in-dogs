const fs = require('fs');

let js = fs.readFileSync('js/act2-screen.js', 'utf8');

// Update Name response responseSeconds calculation
js = js.replace(
  /const delay = Math\.round\(3 \+ Math\.max\(0, Math\.min\(1, this\.severity\)\) \* 5\);/,
  'const delay = parseInt(v.responseSeconds, 10);'
);

// Update renderNameArt to take v and convHtml
js = js.replace(
  /renderNameArt\(v\) \{/g,
  'renderNameArt(v, convHtml) {'
);
js = js.replace(
  /renderGumArt\(v\) \{/g,
  'renderGumArt(v, convHtml) {'
);
js = js.replace(
  /renderEarArt\(v\) \{/g,
  'renderEarArt(v, convHtml) {'
);
js = js.replace(
  /renderPantingArt\(v\) \{/g,
  'renderPantingArt(v, convHtml) {'
);

// Update Gums
js = js.replace(
  /<!-- The refill-time counter: the colourblind-safe half of this observation\. -->\s*<div class="act2-refill-counter"([\s\S]*?)<\/dl>\s*<\/div>\s*`;\s*}/,
  `<div class="act2-check-right-col">
          <div class="act2-check-conversation">
            \${convHtml}
          </div>
          <div class="act2-check-readout-wrap">
            <!-- The refill-time counter: the colourblind-safe half of this observation. -->
            <div class="act2-refill-counter"$1</dl>
          </div>
        </div>
      </div>
    \`;
  }`
);

// Update Ears
js = js.replace(
  /<dl class="act2-check-readout" data-editor-id="act2-readout-ears">([\s\S]*?)<\/dl>\s*<\/div>\s*`;\s*}/,
  `<div class="act2-check-right-col">
          <div class="act2-check-conversation">
            \${convHtml}
          </div>
          <div class="act2-check-readout-wrap">
            <dl class="act2-check-readout" data-editor-id="act2-readout-ears">$1</dl>
          </div>
        </div>
      </div>
    \`;
  }`
);

// Update Panting
js = js.replace(
  /<div class="act2-pant-trace"([\s\S]*?)<\/div>\s*<dl class="act2-check-readout" data-editor-id="act2-readout-panting">([\s\S]*?)<\/dl>\s*<\/div>\s*`;\s*}/,
  `<div class="act2-pant-trace"$1</div>
        <div class="act2-check-right-col">
          <div class="act2-check-conversation">
            \${convHtml}
          </div>
          <div class="act2-check-readout-wrap">
            <dl class="act2-check-readout" data-editor-id="act2-readout-panting">$2</dl>
          </div>
        </div>
      </div>
    \`;
  }`
);

// Update Name
js = js.replace(
  /<div class="act2-count-strip"([\s\S]*?)<\/div>\s*<dl class="act2-check-readout" data-editor-id="act2-readout-name">([\s\S]*?)<\/dl>\s*<\/div>\s*`;\s*}/,
  `<div class="act2-check-right-col">
          <div class="act2-check-conversation">
            \${convHtml}
          </div>
          <div class="act2-check-readout-wrap">
            <div class="act2-count-strip"$1</div>
            <dl class="act2-check-readout" data-editor-id="act2-readout-name">$2</dl>
          </div>
        </div>
      </div>
    \`;
  }`
);

fs.writeFileSync('js/act2-screen.js', js);
