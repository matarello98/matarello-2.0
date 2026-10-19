const sensitiveSignalMessages = new Set([
  "Closing session:",
  "Session already closed",
]);

function installSignalLogRedaction(targetConsole = console) {
  for (const method of ["info", "warn"]) {
    const original = targetConsole[method];
    if (typeof original !== "function") continue;

    targetConsole[method] = function (message, ...args) {
      if (sensitiveSignalMessages.has(message)) return;
      return original.call(this, message, ...args);
    };
  }
}

module.exports = installSignalLogRedaction;
