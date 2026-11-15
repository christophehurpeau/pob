#!/usr/bin/env node

// POB_ENGINE=next runs the pipeline engine from its sources: development only
// until it replaces the yeoman engine.
if (process.env.POB_ENGINE === "next") {
  await import("../src/cli.ts");
} else {
  await import("./pob-yeoman.js");
}
