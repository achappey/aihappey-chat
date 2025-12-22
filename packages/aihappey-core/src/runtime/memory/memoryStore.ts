// Minimal IndexedDB-backed MemoryStore

const DB_NAME = "mcp_memory_db";
const STORE_NAME = "files";

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = () => {
                req.result.createObjectStore(STORE_NAME, { keyPath: "path" });
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
    return dbPromise;
}

async function getFile(path: string): Promise<string | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(path);
        req.onsuccess = () => resolve(req.result?.content ?? null);
        req.onerror = () => reject(req.error);
    });
}

async function writeFile(path: string, content: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put({ path, content });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function deleteFile(path: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(path);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function listDir(path: string): Promise<string[]> {
    const db = await getDB();
    const items: string[] = [];

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.openCursor();

        req.onsuccess = () => {
            const cursor = req.result;
            if (!cursor) return resolve(items);

            const key = cursor.key as string; // assert string once

            if (typeof key === "string" && key.startsWith(path)) {
                items.push(key);
            }

            cursor.continue();
        };
        req.onerror = () => reject(req.error);
    });
}


export const memoryStore = {
    async view(path: string, viewRange?: [number, number]): Promise<string> {
        if (path.endsWith("/")) path = path.slice(0, -1);

        // Directory listing
        if (!path.includes(".")) {
            const files = await listDir(path.endsWith("/") ? path : path + "/");
            return [
                `Directory: ${path}`,
                ...files.map(f => `- ${f.replace(path + "/", "")}`)
            ].join("\n");

        }

        // File content
        const content = await getFile(path);
        if (content == null) throw new Error("File not found");

        const lines = content.split("\n");
        if (!viewRange) return content;

        const [start, end] = viewRange;
        return lines.slice(start - 1, end).join("\n");
    },

    async create(path: string, content: string): Promise<void> {
        await writeFile(path, content);
    },

    async replace(path: string, oldStr: string, newStr: string): Promise<void> {
        const content = await getFile(path);
        if (content == null) throw new Error("File not found");
        await writeFile(path, content.split(oldStr).join(newStr));
    },

    async insert(path: string, line: number, text: string): Promise<void> {
        const content = await getFile(path);
        if (content == null) throw new Error("File not found");
        const lines = content.split("\n");
        lines.splice(line - 1, 0, text);
        await writeFile(path, lines.join("\n"));
    },

    async delete(path: string): Promise<void> {
        const isDir = !path.includes(".");
        if (isDir) {
            const files = await listDir(path);
            await Promise.all(files.map(f => deleteFile(f)));
        } else {
            await deleteFile(path);
        }
    },

    async rename(oldPath: string, newPath: string): Promise<void> {
        const content = await getFile(oldPath);
        if (content == null) throw new Error("File not found");
        await writeFile(newPath, content);
        await deleteFile(oldPath);
    }
};
