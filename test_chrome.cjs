const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\Users\\Usuário\\Desktop\\APP Inspeção\\.chrome-test-profile';

  console.log('Launching Chrome...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:3000/APP-inspe-o/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      const targets = JSON.parse(data);
      const page = targets.find(t => t.type === 'page' && t.url.includes('localhost'));
      if (!page) {
        console.log('Page not found among targets:', targets);
        chrome.kill();
        return;
      }

      console.log('Connecting to page:', page.webSocketDebuggerUrl);
      const ws = new WebSocket(page.webSocketDebuggerUrl);

      let msgId = 1;
      function send(method, params = {}) {
        const id = msgId++;
        ws.send(JSON.stringify({ id, method, params }));
        return id;
      }

      ws.on('open', async () => {
        send('Runtime.enable');
        send('Console.enable');
        send('Page.enable');

        await new Promise(r => setTimeout(r, 2500));

        // Evaluate state
        send('Runtime.evaluate', {
          expression: `
            (function() {
              const root = document.getElementById('root');
              const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
              const hasLogin = !!document.querySelector('input[type="email"], input[type="password"]');
              const bodyHtml = document.body.innerHTML.substring(0, 300);
              return {
                title: document.title,
                hasLogin,
                buttons: buttons.filter(b => b.length > 0),
                bodyPreview: bodyHtml
              };
            })()
          `,
          returnByValue: true
        });
      });

      ws.on('message', (raw) => {
        const msg = JSON.parse(raw);
        if (msg.method === 'Runtime.exceptionThrown') {
          console.error('[EXCEPTION]', JSON.stringify(msg.params.exceptionDetails, null, 2));
        } else if (msg.method === 'Runtime.consoleAPICalled') {
          console.log('[CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
        } else if (msg.result && msg.result.result && msg.result.result.value) {
          console.log('[PAGE EVAL RESULT]', JSON.stringify(msg.result.result.value, null, 2));

          // If we see buttons, try to click "Cadastrar Inspeção"
          const val = msg.result.result.value;
          if (val.buttons && val.buttons.some(b => b.includes('Cadastrar Inspeção') || b.includes('Cadastrar'))) {
            console.log('Found Cadastrar Inspeção button! Clicking it...');
            send('Runtime.evaluate', {
              expression: `
                (function() {
                  const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Cadastrar Inspeção'));
                  if (btn) {
                    btn.click();
                    return 'Clicked button: ' + btn.innerText;
                  }
                  return 'Button not found';
                })()
              `,
              returnByValue: true
            });

            setTimeout(() => {
              // Check DOM after click
              send('Runtime.evaluate', {
                expression: `
                  (function() {
                    return {
                      bodyText: document.body.innerText.substring(0, 500),
                      h1: Array.from(document.querySelectorAll('h1, h2')).map(h => h.innerText),
                      isWhite: document.body.innerText.trim() === ''
                    };
                  })()
                `,
                returnByValue: true
              });

              setTimeout(() => {
                ws.close();
                chrome.kill();
              }, 2000);
            }, 1000);
          } else if (val.hasLogin) {
            console.log('App is on Login page! Simulating login or checking credentials...');
            ws.close();
            chrome.kill();
          } else {
            console.log('Other state...');
            setTimeout(() => {
              ws.close();
              chrome.kill();
            }, 1500);
          }
        }
      });
    });
  });
}

run();
