const request = require("request");
const logTypes = require("./logTypes");
const getCircularReplacer = require("./utils/getCircularReplacer");
const getFunctionArguments = require("./utils/getFunctionArguments");

module.exports = class {
  constructor(
    host,
    port,
    options = {
      hookIntoProcess: true,
      overrideConsole: true,
      name: this.getHostname()
    }
  ) {
    this.name = options.name;
    this.host = host;
    this.port = port;
    this.uri = `http://${this.host}:${this.port}`;

    if (options.overrideConsole) this.overrideConsole();
    if (options.hookIntoProcess) this.hookIntoProcess();
  }

  overrideConsole() {
    logTypes.forEach(type => {
      console[`_${type}`] = console[type];
      console[type] = (...messages) => this.onConsoleMessage(type, messages);
    });
  }

  hookIntoProcess() {
    process.on("uncaughtException", err => {
      console._error(err);
      this.doRequest({ type: "error", messages: [err.stack] })
        .catch(e => console._error(e))
        .finally(() => process.exit(1));
    });
  }

  onConsoleMessage(type, messages) {
    // Log to client
    console[`_${type}`](...messages);

    // Send to server
    const body = { type, messages: this.jsonifyMessages(messages) };
    this.doRequest(body).catch(e => console._error(e));
  }

  jsonifyMessages(messages) {
    return messages.map(m => this.parseMessage(m));
  }

  parseMessage(m) {
    if (typeof m === "undefined") return "undefined";
    if (m === null) return "null";
    if (typeof m === "function")
      return `[Function: (${getFunctionArguments(m)})]`;
    if (typeof m === "symbol") return "[Symbol]";
    if (m instanceof Error) return m.stack;
    if (typeof m === "object") {
      const o = { ...m };
      Object.keys(m).forEach(key => {
        console._log(key);
        o[key] = this.parseMessage(m[key]);
      });
      return o.valueOf();
    }
    return m.toString();
  }

  doRequest(body) {
    body = JSON.stringify(
      { ...body, hostname: this.name },
      getCircularReplacer()
    );

    return new Promise((resolve, reject) => {
      request.post(
        {
          uri: this.uri,
          body,
          headers: { "content-type": "application/json" }
        },
        (error, res) => {
          if (error) return reject(error);
          if (res.statusCode === 200) return resolve();
          reject(new Error("Bad Request"));
        }
      );
    });
  }

  getHostname() {
    return require("os").hostname();
  }
};
