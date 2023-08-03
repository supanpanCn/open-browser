const { exec, spawn } = require("child_process");
const { readFileSync, existsSync } = require("fs");
const { networkInterfaces } = require("os");

const HOSTSPATH = "/etc/hosts";

const AIMBROWSERS = [
  "Google Chrome Canary",
  "Google Chrome Dev",
  "Google Chrome Beta",
  "Google Chrome",
  "Microsoft Edge",
  "Brave Browser",
  "Vivaldi",
  "Chromium",
];

const PLUGINNAME = "open-browser";

function parseHosts() {
  const mappings = {};
  if (existsSync(HOSTSPATH)) {
    try {
      const code = readFileSync(HOSTSPATH, "utf-8");
      const lines = code.split("\n");

      for (let line of lines) {
        line = line.trim();
        if (line.startsWith("#") || line === "") {
          continue;
        }
        const tokens = line.split(/\s+/);
        const ip = tokens[0];

        for (let i = 1; i < tokens.length; i++) {
          const domain = tokens[i];
          if (!mappings[ip]) {
            mappings[ip] = [];
          }
          mappings[ip].push(domain);
        }
      }
    } catch (_) {}
  }

  return mappings;
}

function getIps() {
  const interfaces = networkInterfaces();
  const ips = [];

  for (const name in interfaces) {
    const networkInterface = interfaces[name];
    for (const network of networkInterface) {
      if (network.family === "IPv4" && !network.internal) {
        ips.push(network.address);
      }
    }
  }

  return ips;
}

function execAsync(command, options) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout.toString());
      }
    });
  });
}

function openByJs(urls, legalBrowser) {
  try {
    const cliArguments = ["-a", legalBrowser, urls[urls.length - 1]];
    spawn("open", cliArguments);
  } catch (_) {}
}

module.exports = {
  execAsync,
  getIps,
  parseHosts,
  AIMBROWSERS,
  PLUGINNAME,
  openByJs,
};
