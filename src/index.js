const {
  getIps,
  parseHosts,
  AIMBROWSERS,
  execAsync,
  PLUGINNAME,
} = require("./util.js");
const { resolve } = require("path");

let port;

async function _check(address = () => {}) {
  if (process.platform === "darwin") {
    const ips = getIps();
    const mapping = parseHosts();
    let openUrl = "";
    for (let i = 0; i < ips.length; i++) {
      const host = mapping[ips[i]];
      if (host) {
        openUrl = address(host, port);
        break;
      }
    }
    return openUrl;
  }
}

async function _openBrowser(url) {
  const ps = await execAsync("ps cax");
  const legalBrowser = AIMBROWSERS.find((b) => ps.includes(b));
  if (legalBrowser) {
    await execAsync(
      `osascript openChrome.applescript "${encodeURI(url)}" "${legalBrowser}"`,
      {
        cwd: resolve(__dirname, ".."),
      }
    );
  }
}

class OpenBrowser {
  constructor(address, port = 9090) {
    this.address = address;
    this.port = port;
  }
  async apply(compiler) {
    port = process.env.PORT || this.port;
    let openUrl = await _check(this.address);
    if (openUrl) {
      if (compiler.options && compiler.options.devServer) {
        // the port has already been correctly set for the devServer externally.
        // so , there is no need to fetch it again.
        // if you want to make it more general, you can call portfinder here.
        const realPort = compiler.options.devServer.port;
        delete compiler.options.devServer.open;
        compiler.hooks.emit.tapPromise(PLUGINNAME, async () => {
          // TODO:validate it
          openUrl = openUrl.replace(port, realPort);
          await _openBrowser(openUrl);
        });
      }
    }
  }
}

module.exports = OpenBrowser;
