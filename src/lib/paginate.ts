/**
 * Async iterator that repeatedly calls `fetchPage` until no more results.
 * Stops when the returned array length is 0 or less than `pageSize`.
 */
export async function* paginateByPage<T>(
    fetchPage: (cursor: string | undefined) => Promise<T[]>,
    options?: { pageSize?: number; cursorField?: "before" | "after" }
): AsyncGenerator<T[], void, undefined> {
    const pageSize = options?.pageSize ?? 50;
    let cursor: string | undefined;
    let done = false;

    while (!done) {
        const batch = await fetchPage(cursor);
        if (!batch.length) break;
        yield batch;
        if (batch.length < pageSize) {
            done = true;
            break;
        }
        const last = batch[batch.length - 1] as Record<string, unknown>;
        const ts = last.created_at ?? last.sent_at ?? last.createdAt;
        if (typeof ts === "string") {
            cursor = ts;
        } else {
            done = true;
        }
    }
}
