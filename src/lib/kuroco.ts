// Kuroco CMS client
// Fetches content from Kuroco headless CMS at build/request time.

const KUROCO_BASE = 'https://sunagare.g.kuroco.app/rcms-api/2';
const TOKEN = '68402775f62a2707252cba272b91d2cde29dc4b2a659cf14ef59eb491e096137';

export type KurocoItem = {
    topics_id: number;
    subject: string;
    slug: string;
};

type KurocoListResponse = {
    errors: unknown[];
    list: KurocoItem[];
    pageInfo?: { totalCnt: number };
};

async function fetchEndpoint(endpoint: string): Promise<KurocoItem[]> {
    const res = await fetch(`${KUROCO_BASE}/${endpoint}`, {
        headers: { 'X-RCMS-API-ACCESS-TOKEN': TOKEN },
        next: { revalidate: 300 }, // ISR: revalidate every 5 minutes
    });
    if (!res.ok) {
        console.error(`Kuroco fetch failed: ${endpoint}`, res.status);
        return [];
    }
    const data: KurocoListResponse = await res.json();
    return data.list ?? [];
}

function toMap(items: KurocoItem[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (const item of items) {
        map[item.slug] = item.subject;
    }
    return map;
}

export async function getProfile(): Promise<Record<string, string>> {
    return toMap(await fetchEndpoint('profiles'));
}

export async function getContactInfo(): Promise<Record<string, string>> {
    return toMap(await fetchEndpoint('contact_info'));
}

export type NavItem = { name: string; href: string };

export async function getNavigation(): Promise<NavItem[]> {
    const items = await fetchEndpoint('navigation');
    // subject format: "Name|/path"
    const order = ['portfolio', 'about', 'contact'];
    return items
        .map((i): NavItem => {
            const [name, href] = i.subject.split('|');
            return { name: (name ?? i.slug).trim(), href: (href ?? '/').trim() };
        })
        .sort((a, b) => {
            const ai = order.indexOf(a.name.toLowerCase());
            const bi = order.indexOf(b.name.toLowerCase());
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
}

// Helper: pull profile work items (slug starts with "work_") sorted by number
export function getWorkItems(profile: Record<string, string>): string[] {
    return Object.entries(profile)
        .filter(([k]) => k.startsWith('work_'))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => v);
}
