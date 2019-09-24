# Achtung

Zwischen Client & Server gibt es keine Au·then·ti·fi·zie·rung. Für eine Produktionsumgebung, muss dieses Modul dementsprechend angepasst werden. Es wird zudem mit dem unsicheren HTTP (nicht HTTPS)-Protokoll kommuniziert. Zum Testen ok, mehr noch nicht.

## Nutzung

Server

```
const LoggingServer = require("./index").Server;

const loggingServer = new LoggingServer(
  4505,
  () => {
    console.log("Server started!");
  },
  ({ type, messages, hostname }) => {
    console.log(`${hostname} : ${type} >`, ...messages);
  }
);
```

Client

```
const LoggingClient = require("./index").Client;

const options = {
    hookIntoProcess,      (optional)    // Override uncaughtException   (default: true)
    overrideConsole,      (optional)    // Override console.log/warn/error/etc. (default: true)
    name                  (optional)    // Name to identify at the server (default: hostname)
};

const loggingClient = new LoggingClient("localhost", 4505, options);
```
