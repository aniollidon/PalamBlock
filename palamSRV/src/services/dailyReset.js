const { CronJob } = require("cron");
const { Alumne, Grup } = require("../database/db");
const { logger } = require("../logger");

// Runs a bulk reset: sets status to 'RuleOn' for all students and groups
async function runRuleOnReset() {
  try {
    const [alumneRes, grupRes] = await Promise.all([
      Alumne.updateMany({}, { $set: { status: "RuleOn" } }),
      Grup.updateMany({}, { $set: { status: "RuleOn" } }),
    ]);

    logger.info(
      `Daily reset executed: Alumne modified=${
        alumneRes.modifiedCount ?? alumneRes.nModified ?? 0
      }, Grup modified=${grupRes.modifiedCount ?? grupRes.nModified ?? 0}`
    );
  } catch (err) {
    logger.error("Daily reset failed", err);
  }
}

// Schedules the reset every day at 16:00 (Europe/Madrid)
function scheduleDailyRuleOnReset() {
  const job = new CronJob(
    "0 0 16 * * *", // sec min hour dom mon dow
    runRuleOnReset,
    null,
    true, // start immediately
    "Europe/Madrid"
  );

  logger.info("Scheduled daily RuleOn reset at 16:00 (Europe/Madrid)");
  return job; // returned in case we want to manage/stop it on shutdown
}

module.exports = { scheduleDailyRuleOnReset, runRuleOnReset };
