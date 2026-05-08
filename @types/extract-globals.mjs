import fs from "node:fs";
import path from "node:path";
import { exit } from "node:process";

const DEFINITION_FILE = path.resolve(import.meta.dirname, "NetscriptDefinitions.d.ts");
const GLOBALS_FILE = path.resolve(import.meta.dirname, "global.d.ts");

if (!fs.existsSync(DEFINITION_FILE)) {
	console.error("ERROR: Definition file does not exist, connect the game to the server once.");
	exit(1);
}

const content = fs.readFileSync(DEFINITION_FILE, "utf8");

fs.writeFileSync(GLOBALS_FILE, content.replaceAll(/^export /gm, ""), "utf-8");

console.log("Global Definition file created.");