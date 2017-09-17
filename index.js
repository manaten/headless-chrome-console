const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');

const url = process.argv[2];

(async () => {
  const chrome = await chromeLauncher.launch({
    chromeFlags: [
      '--headless',
      '--disable-gpu',
      '--incognito',
    ],
  });
  const protocol = await CDP({port: chrome.port});

  const {
          DOM,
          Network,
          Page,
          Runtime,
          Log,
        } = protocol;

  await Promise.all([
    Network.enable(),
    Page.enable(),
    DOM.enable(),
    Runtime.enable(),
    Log.enable(),
  ]);

  Log.entryAdded(({entry}) => {
    console.log([
      `baseUrl:${url}`,
      `source:${entry.source}`,
      `level:${entry.level}`,
      `text:${entry.text.replace(/\n/, '\\n').replace(/\t/, '\\t')}`,
      `timestamp:${new Date(entry.timestamp).toISOString()}`,
      `url:${entry.url}`
    ].join('\t'));
  });

  await Page.navigate({url});

  Page.loadEventFired(() => {
    protocol.close();
    chrome.kill();
  });
})().catch(e => console.error(e));
