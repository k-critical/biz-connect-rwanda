import "server-only";
import { env } from "@/config/env";
import { LocalFileStorage, type FileStorage } from "./local-file-storage";

export const storage: FileStorage = new LocalFileStorage(env.UPLOADS_DIR);

export { isValidStorageKey, type FileStorage } from "./local-file-storage";
