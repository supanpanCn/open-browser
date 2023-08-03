const {
  getIps,
  parseHosts,
  AIMBROWSERS,
  execAsync,
  PLUGINNAME,
  openByJs
} = require("./util.js");
const { resolve } = require("path");

let port;
const errs = []
let tryTimes = -1

async function _check(address = () => {}) {
  const queue = [];
  if (process.platform === "darwin") {
    const ips = getIps();
    const mapping = parseHosts();
    for (let i = 0; i < ips.length; i++) {
      const hosts = mapping[ips[i]];
      if (Array.isArray(hosts) && hosts.length) {
        hosts.forEach((h) => {
          queue.push(address(h, port));
        });
        break;
      }
    }
    tryTimes = queue.length
    return queue;
  }
  return queue;
}

async function tryOpen(payload) {
  const { url, fallback, legalBrowser,onError } = payload;
  try {
    await execAsync(
      `osascript openChrome.applescript "${encodeURI(url)}" "${legalBrowser}" "${fallback}"`,
      {
        cwd: resolve(__dirname, ".."),
      }
    );
  } catch (_) {
    onError()
  }
}

async function _openBrowser(urls, fallback) {
  const ps = await execAsync("ps cax");
  const legalBrowser = AIMBROWSERS.find((b) => ps.includes(b));
  if (legalBrowser) {
    let isBreak = false
    for (let i = 0; i < urls.length && !isBreak; i++) {
      const openStatus = await tryOpen({
        url: urls[i],
        fallback,
        legalBrowser,
        onError:()=>{
          isBreak = true
          const act = urls[i]
          urls.splice(i,1)
          setTimeout(()=>{
            errs.push(act)
            _openBrowser(urls,fallback)
          },100)
        }
      });
      if (openStatus === true) {
        tryTimes = -1
        errs.length = 0
        break;
      }
    }
    if(tryTimes === errs.length){
      openByJs(errs,legalBrowser)
    }
  }
}

class OpenBrowser {
  constructor(payload) {
    const { address, port = 9090, fallback } = payload;
    this.address = address;
    this.port = port;
    this.opened = false;
    this.fallback = fallback;
  }
  async apply(compiler) {
    port = process.env.PORT || this.port;
    let urls = await _check(this.address);
    if (urls.length) {
      if (compiler.options && compiler.options.devServer) {
        // the port has already been correctly set for the devServer externally.
        // so , there is no need to fetch it again.
        // if you want to make it more general, you can call portfinder here.
        const realPort = compiler.options.devServer.port;
        delete compiler.options.devServer.open;
        compiler.hooks.emit.tapPromise(PLUGINNAME, async () => {
          if(!this.opened){
            // TODO:validate it
            urls = urls.map((u) => u.replace(port, realPort));
            await _openBrowser(urls, this.fallback);
          }
          this.opened = true;
        });
      }
    }
  }
}

module.exports = OpenBrowser;
