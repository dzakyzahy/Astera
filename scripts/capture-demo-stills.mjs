import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const baseUrl = process.argv[2] ?? 'http://localhost:3000';
const outputDirectory = resolve('outputs/demo-stills');
const browserCandidates = process.platform === 'win32'
  ? [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ]
  : process.platform === 'darwin'
    ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
    : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];

async function findBrowser() {
  for (const candidate of browserCandidates) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Continue to the next supported local browser.
    }
  }
  throw new Error('Chrome or Edge is required to capture the demo stills.');
}

async function reservePort() {
  const server = createServer();
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  await new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()));
  return port;
}

async function waitForJson(url, timeoutMs = 12_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // Browser startup is still in progress.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 150));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function createCdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  let nextId = 0;
  const pending = new Map();

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const request = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });

  return {
    ready: new Promise((resolveOpen, reject) => {
      socket.addEventListener('open', resolveOpen, { once: true });
      socket.addEventListener('error', reject, { once: true });
    }),
    call(method, params = {}) {
      return new Promise((resolveCall, reject) => {
        const id = ++nextId;
        pending.set(id, { resolve: resolveCall, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() {
      socket.close();
    },
  };
}

const wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));

async function run() {
  const serverResponse = await fetch(baseUrl);
  if (!serverResponse.ok) throw new Error(`ASTERA is not reachable at ${baseUrl}. Start it with npm run dev.`);

  const browserPath = await findBrowser();
  const port = await reservePort();
  const profileDirectory = await mkdtemp(join(tmpdir(), 'astera-demo-capture-'));
  const browser = spawn(browserPath, [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-networking',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDirectory}`,
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true });

  let browserClient;
  let pageClient;

  try {
    const version = await waitForJson(`http://127.0.0.1:${port}/json/version`);
    browserClient = createCdpClient(version.webSocketDebuggerUrl);
    await browserClient.ready;

    const page = await fetch(
      `http://127.0.0.1:${port}/json/new?${encodeURIComponent(baseUrl)}`,
      { method: 'PUT' },
    ).then((response) => response.json());
    pageClient = createCdpClient(page.webSocketDebuggerUrl);
    await pageClient.ready;

    const call = pageClient.call.bind(pageClient);
    const evaluate = async (expression) => {
      const result = await call('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result.value;
    };
    const click = async (selector, text) => {
      const clicked = await evaluate(`(() => {
        const element = [...document.querySelectorAll(${JSON.stringify(selector)})]
          .find((candidate) => candidate.textContent?.includes(${JSON.stringify(text)}));
        if (!element) return false;
        element.click();
        return true;
      })()`);
      if (!clicked) throw new Error(`Could not find ${selector} containing "${text}".`);
    };

    await mkdir(outputDirectory, { recursive: true });
    await call('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await call('Page.navigate', { url: baseUrl });
    await wait(2_000);
    await evaluate(`fetch('/api/demo/reset', { method: 'POST' }).then((response) => response.ok)`);
    await call('Page.reload', { ignoreCache: true });
    await wait(2_000);

    const files = [];
    const capture = async (fileName, label) => {
      const screenshot = await call('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: false,
      });
      await writeFile(join(outputDirectory, fileName), Buffer.from(screenshot.data, 'base64'));
      files.push({ file: fileName, label });
    };

    await capture('01-portfolio-overview.png', 'Portfolio overview and synthetic-data trust boundary');

    await click('.estate-switcher', 'All estates');
    await wait(100);
    await click('.estate-menu button', 'Bali Villa');
    await wait(250);
    await capture('02-bali-incident.png', 'Bali Villa incident and evidence-led recommendation');

    await click('.review-action', 'Review vendor quotes');
    await wait(250);
    await capture('03-normalized-quotes.png', 'Normalized quote comparison');

    await click('.quote-actions .primary-action', 'Approve');
    await wait(150);
    await capture('04-human-approval.png', 'Explicit human approval checkpoint');

    await evaluate(`document.querySelector('.approval-check input')?.click()`);
    await click('.quote-actions .primary-action', 'Confirm approval');
    await wait(900);
    await capture('05-dispatch-checkpoint.png', 'Approval recorded before dispatch becomes available');

    await click('.dispatch-panel .primary-action', 'Record simulated dispatch');
    await wait(900);
    await capture('06-simulated-dispatch.png', 'Synthetic dispatch recorded with no external vendor contact');

    await evaluate(`document.querySelector('#audit')?.scrollIntoView({ block: 'start' })`);
    await wait(200);
    await capture('07-audit-trail.png', 'Accountable decision in the audit timeline');

    await evaluate(`fetch('/api/demo/reset', { method: 'POST' }).then((response) => response.ok)`);
    await writeFile(join(outputDirectory, 'manifest.json'), JSON.stringify({
      capturedAt: new Date().toISOString(),
      browser: version.Browser,
      viewport: { width: 1440, height: 900 },
      source: baseUrl,
      synthetic: true,
      externalActions: false,
      files,
    }, null, 2));

    console.log(`Captured ${files.length} synthetic demo stills in ${outputDirectory}`);
  } finally {
    pageClient?.close();
    if (browserClient) {
      try {
        await browserClient.call('Browser.close');
      } catch {
        browser.kill();
      }
      browserClient.close();
    } else {
      browser.kill();
    }
    await wait(300);
    await rm(profileDirectory, { recursive: true, force: true });
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
