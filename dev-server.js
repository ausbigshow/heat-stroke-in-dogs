const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function runGit(cmd) {
  try {
    return execSync(`git ${cmd}`, { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
  } catch (err) {
    console.error(`Git error executing "git ${cmd}":`, err.message);
    throw err;
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message, errorDetail = null) {
  sendJson(res, statusCode, {
    success: false,
    message,
    error: errorDetail ? String(errorDetail) : null
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  // --- API Endpoints ---

  // GET /api/versions: Return recent commits
  if (req.method === 'GET' && pathname === '/api/versions') {
    try {
      const output = runGit('log -n 30 --pretty=format:"%h|%H|%ad|%ar|%s" --date=format:"%Y-%m-%d %H:%M"');
      const lines = output ? output.split('\n') : [];
      const versions = lines.map(line => {
        const [shortHash, hash, date, relative, message] = line.split('|');
        return { shortHash, hash, date, relative, message };
      });
      return sendJson(res, 200, { success: true, versions });
    } catch (err) {
      return sendError(res, 500, 'Failed to retrieve version history', err);
    }
  }

  // POST /api/checkpoint: Create a named checkpoint
  if (req.method === 'POST' && pathname === '/api/checkpoint') {
    try {
      const { name } = await parseBody(req);
      const checkpointName = (name || 'unnamed checkpoint').trim();
      runGit('add .');
      // Check if there are changes to commit, or create an empty checkpoint if clean
      let commitMessage = `checkpoint: ${checkpointName}`;
      try {
        runGit(`commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
      } catch (commitErr) {
        // If nothing staged, allow commit --allow-empty
        runGit(`commit --allow-empty -m "${commitMessage.replace(/"/g, '\\"')}"`);
      }
      const shortHash = runGit('rev-parse --short HEAD');
      return sendJson(res, 200, { success: true, message: `Created checkpoint "${checkpointName}"`, hash: shortHash });
    } catch (err) {
      return sendError(res, 500, 'Failed to create checkpoint', err);
    }
  }

  // GET /api/notes: Return stored sticky notes
  if (req.method === 'GET' && pathname === '/api/notes') {
    try {
      const notesPath = path.join(ROOT_DIR, 'data', 'notes.json');
      if (fs.existsSync(notesPath)) {
        const content = fs.readFileSync(notesPath, 'utf8');
        const notes = JSON.parse(content || '[]');
        return sendJson(res, 200, { success: true, notes });
      }
      return sendJson(res, 200, { success: true, notes: [] });
    } catch (err) {
      return sendError(res, 500, 'Failed to read notes', err);
    }
  }

  // POST /api/save-notes: Save sticky notes & create git commit
  if (req.method === 'POST' && pathname === '/api/save-notes') {
    try {
      const { notes } = await parseBody(req);
      const dataDir = path.join(ROOT_DIR, 'data');
      fs.mkdirSync(dataDir, { recursive: true });
      const notesPath = path.join(dataDir, 'notes.json');
      fs.writeFileSync(notesPath, JSON.stringify(notes || [], null, 2), 'utf8');

      runGit('add data/notes.json');
      try {
        runGit('commit -m "notes: update visual feedback sticky notes"');
      } catch (commitErr) {
        // Clean if no diff
      }

      return sendJson(res, 200, { success: true, message: 'Notes saved successfully' });
    } catch (err) {
      return sendError(res, 500, 'Failed to save notes', err);
    }
  }

  // POST /api/save-visual-edits: Surgically persist CSS overrides & git commit
  if (req.method === 'POST' && pathname === '/api/save-visual-edits') {
    try {
      const { target, cssContent, rulesMap, removedSelectors = [] } = await parseBody(req);
      const targetDesc = target || 'visual adjustments';
      
      const overridesPath = path.join(ROOT_DIR, 'css', 'visual-overrides.css');
      
      let finalCss = '';
      if (cssContent !== undefined) {
        finalCss = cssContent;
      } else if (rulesMap && typeof rulesMap === 'object') {
        let existingCss = '';
        if (fs.existsSync(overridesPath)) {
          existingCss = fs.readFileSync(overridesPath, 'utf8');
        }

        const mergedMap = {};
        const rawBlocks = [];
        const existingBlocks = existingCss.split(/(?:\r?\n){2,}/);

        for (const block of existingBlocks) {
          if (!block.trim()) continue;
          if (block.startsWith('/* Visual Edit Mode Overrides')) continue;
          
          const match = block.trim().match(/^(\[data-editor-id="[^"]+"\])\s*\{([\s\S]*?)\}$/);
          if (match) {
            const selector = match[1];
            const body = match[2];
            const decls = {};
            let parseable = true;
            const lines = body.split(';');
            for (const line of lines) {
               const l = line.trim();
               if (!l) continue;
               const propMatch = l.match(/^([^:]+):\s*(.*?)(?:\s*!important)?$/);
               if (propMatch) {
                 // An empty value ("left:  !important") is an invalid declaration the browser
                 // already drops. Older saves wrote some; don't carry them forward.
                 const val = propMatch[2].trim();
                 if (val) decls[propMatch[1].trim()] = val;
               } else {
                 parseable = false;
                 break;
               }
            }
            if (parseable) {
               mergedMap[selector] = decls;
            } else {
               rawBlocks.push(block.trim());
            }
          } else {
            rawBlocks.push(block.trim());
          }
        }

        // Check if there are actual changes
        if (Object.keys(rulesMap).length === 0 && removedSelectors.length === 0) {
          finalCss = existingCss;
        } else {
          // Apply removals
          for (const sel of removedSelectors) {
            delete mergedMap[sel];
          }

          // Apply additions/updates
          for (const [selector, decls] of Object.entries(rulesMap)) {
            mergedMap[selector] = decls;
          }

          const outBlocks = [];
          outBlocks.push(`/* Visual Edit Mode Overrides - Last updated: ${new Date().toISOString()} */`);
          
          for (const rb of rawBlocks) {
            outBlocks.push(rb);
          }
          
          const sortedSelectors = Object.keys(mergedMap).sort();
          for (const selector of sortedSelectors) {
            const decls = mergedMap[selector];
            const props = Object.entries(decls)
              .map(([prop, val]) => `  ${prop}: ${val} !important;`)
              .join('\n');
            outBlocks.push(`${selector} {\n${props}\n}`);
          }

          finalCss = outBlocks.join('\n\n') + '\n';
        }
      }

      // Ensure css directory exists
      fs.mkdirSync(path.join(ROOT_DIR, 'css'), { recursive: true });
      fs.writeFileSync(overridesPath, finalCss, 'utf8');

      // Stage and commit per rule 3 of version-control.md
      runGit('add css/visual-overrides.css');
      try {
        runGit(`commit -m "visual-save: ${targetDesc.replace(/"/g, '\\"')}"`);
      } catch (commitErr) {
        // If file content didn't change from previous commit, treat as clean success
      }

      const shortHash = runGit('rev-parse --short HEAD');
      return sendJson(res, 200, {
        success: true,
        message: 'Saved to source',
        hash: shortHash,
        file: 'css/visual-overrides.css'
      });
    } catch (err) {
      console.error('Error in save-visual-edits:', err);
      return sendError(res, 500, 'Save failed — source file was not modified', err);
    }
  }

  // POST /api/revert-save: Revert last visual save
  if (req.method === 'POST' && pathname === '/api/revert-save') {
    try {
      // 1. Create a safety backup first
      try {
        runGit('add .');
        runGit('commit -m "recovery-backup: before reverting last save"');
      } catch (e) {
        // Ignore if clean
      }

      // 2. Find the last commit that was a visual-save
      const log = runGit('log -n 20 --pretty=format:"%h|%s"');
      const lines = log.split('\n');
      let targetCommit = null;

      // Find the visual-save commit and revert or restore file from HEAD~1
      const overridesPath = path.join(ROOT_DIR, 'css', 'visual-overrides.css');
      try {
        runGit('checkout HEAD~1 -- css/visual-overrides.css');
        runGit('add css/visual-overrides.css');
        runGit('commit -m "restore: previous visual overrides"');
      } catch (checkoutErr) {
        // If unable to checkout HEAD~1, reset file to empty comment
        fs.writeFileSync(overridesPath, '/* Visual Edit Mode Overrides */\n', 'utf8');
        runGit('add css/visual-overrides.css');
        runGit('commit -m "restore: reset visual overrides"');
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Successfully reverted last visual save'
      });
    } catch (err) {
      return sendError(res, 500, 'Failed to revert last save', err);
    }
  }

  // POST /api/restore-version: Restore to specific commit
  if (req.method === 'POST' && pathname === '/api/restore-version') {
    try {
      const { hash } = await parseBody(req);
      if (!hash) return sendError(res, 400, 'Commit hash required');

      // Create safety backup
      try {
        runGit('add .');
        runGit(`commit -m "recovery-backup: before restoring ${hash}"`);
      } catch (e) {}

      // Checkout files from target hash
      runGit(`checkout ${hash} -- .`);
      runGit('add .');
      runGit(`commit -m "restore: recovered state from ${hash}"`);

      return sendJson(res, 200, {
        success: true,
        message: `Successfully restored state from ${hash}`
      });
    } catch (err) {
      return sendError(res, 500, 'Failed to restore version', err);
    }
  }

  // --- Static File Serving ---
  let filePath = path.join(ROOT_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security check: prevent directory traversal
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(path.resolve(ROOT_DIR))) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🐶 Heatstroke in Dogs eLearning Dev Server Running`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🛠️  Edit Mode: Press Ctrl+Shift+E or open ?edit=true`);
  console.log(`=======================================================`);
});
