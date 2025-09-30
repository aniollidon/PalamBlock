// logger.js
require("dotenv").config();

const DEVELOPMENT = process.env.NODE_ENV === "development";

function formatDate() {
  const ara = new Date();

  const dia = ara.getDate();
  const mes = ara.getMonth() + 1; // Els mesos comencen a 0
  const any = ara.getFullYear().toString().slice(-2); // Últimes dues xifres

  const hores = ara.getHours().toString().padStart(2, "0");
  const minuts = ara.getMinutes().toString().padStart(2, "0");
  const segons = ara.getSeconds().toString().padStart(2, "0");

  return `[${dia}/${mes}/${any} ${hores}:${minuts}:${segons}]`;
}

class CustomLogger {
  constructor() {
    this.level = process.env.LOGGER_LEVEL || "info";
    this.info("Logger init! level: " + this.level);
  }

  trace(...msg) {
    if (this.level === "trace") console.log("[TRACE] ", ...msg);
  }

  info(...msg) {
    if (
      this.level === "info" ||
      this.level === "debug" ||
      this.level === "trace"
    )
      console.log(`[INFO] ${formatDate()}`, ...msg);
  }

  error(...msg) {
    console.error("[ERROR] " + formatDate(), ...msg);
    console.log("[ERROR] " + formatDate(), ...msg);
    if (DEVELOPMENT) throw new Error(msg);
  }

  warn(...msg) {
    console.warn("[WARN] " + formatDate(), ...msg);
  }

  debug(...msg) {
    if (this.level === "debug" || this.level === "trace")
      console.log("[DEBUG] " + formatDate(), ...msg);
  }

  trace(...msg) {
    if (this.level === "trace") console.log("[TRACE] " + formatDate(), ...msg);
  }
}

const logger = new CustomLogger();
module.exports.logger = logger;
