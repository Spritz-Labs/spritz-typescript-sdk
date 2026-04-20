/**
 * Generic page-based paginator.
 * Calls `fetcher(page)` repeatedly until fewer than `pageSize` results are returned.
 */
export async function paginateByPage<T>(
    fetcher: (page: number) => Promise<T[]>,
    opts: { pageSize?: number; maxPages?: number } = {},
): Promise<T[]> {
    const pageSize = opts.pageSize ?? 50;
    const maxPages = opts.maxPages ?? 100;
    const all: T[] = [];
    let page = 1;

    while (page <= maxPages) {
        const items = await fetcher(page);
        all.push(...items);
        if (items.length < pageSize) break;
        page += 1;
    }

    return all;
}
