import { file as lean4leanFile } from "./handshake/lean4lean-js";
import { file as nanodaFile } from "./handshake/nanoda-js";

/** efran is priority only and has no file. The two kernels do. */
export const HANDSHAKE_FILES = {
  efran: null,
  "nanoda-js": nanodaFile,
  "lean4lean-js": lean4leanFile,
} as const;
