import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDir = path.resolve(__dirname, "../models");
console.log("Models:", fs.readdirSync(modelsDir));
