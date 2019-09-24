const http = require("http");
const logTypes = require("./logTypes");

module.exports = class {
  constructor(port, callback, onLog) {
    this.onServerStarted = this.onServerStarted.bind(this);
    this.onRequest = this.onRequest.bind(this);
    this.onMessageReceived = this.onMessageReceived.bind(this);

    this.listening = false;
    this.callback = callback;
    this.onLog = onLog;

    this.httpServer = http.createServer(this.onRequest);
    this.httpServer.listen(port, this.onServerStarted);
  }

  onServerStarted() {
    this.listening = true;
    this.callback();
  }

  onRequest(req, res) {
    if (!this.isValidRequest(req)) {
      res.statusCode = 400;
      res.end();
      return;
    }

    let body = [];
    req
      .on("data", chunk => {
        body.push(chunk);
      })
      .on("end", () => {
        body = Buffer.concat(body).toString();

        // Modify req
        req.body = body;

        // Answer client
        res.statusCode = 200;
        res.end();

        this.onMessageReceived(req);
      })
      .on("error", error => console.error(error.stack));
  }

  isValidRequest(req) {
    return (
      req.method === "POST" &&
      req.headers["content-type"] === "application/json"
    );
  }

  onMessageReceived(req) {
    let body;
    try {
      body = JSON.parse(req.body);
    } catch (e) {
      console.error(e);
      return;
    }

    if (!body.type) return;
    if (!body.messages) return;
    if (!body.hostname) return;

    if (!logTypes.includes(body.type)) return;
    if (!Array.isArray(body.messages)) return;
    if (!typeof body.hostname === "string") return;
    if (body.hostname.length === 0 || !body.hostname.trim()) return;

    if (this.onLog) this.onLog(body);
    else console[body.type](...body.messages);
  }

  close() {
    this.httpServer.close(error => {
      if (error) console.error(error);
      this.listening = false;
    });
  }
};
