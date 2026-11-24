import Link from 'next/link';
import { DesignersExplorer } from '@/components/features/explore/designers-explorer';
import { ProjectsExplorer } from '@/components/features/explore/projects-explorer';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils/cn';
import { single } from '@/lib/utils/url';

type SearchParams = Record<string, string | string[] | undefined>;

const tabs = [
  { id: 'projects', label: 'Projects', href: '/explore' },
  { id: 'designers', label: 'Designers', href: '/explore?tab=designers' },
] as const;

export default async function ExplorePage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await searchParamsPromise;
  const tab = single(searchParams.tab) === 'designers' ? 'designers' : 'projects';

  return (
    <div className="shell page">
      <PageHeader
        eyebrow="Explore"
        title="Rooms to love, designers to hire."
        description="Browse finished projects for ideas, or look for a designer directly."
      />

      <nav
        aria-label="Explore sections"
        className="mt-8 inline-flex rounded-pill border border-hairline bg-surface p-1"
      >
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-current={tab === item.id ? 'page' : undefined}
            className={cn(
              'rounded-pill px-6 py-2.5 text-sm font-semibold transition-colors duration-200',
              tab === item.id
                ? 'bg-brand text-canvas'
                : 'text-ink/70 hover:text-brand',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        {tab === 'designers' ? (
          <DesignersExplorer searchParams={searchParams} />
        ) : (
          <ProjectsExplorer
            style={single(searchParams.style)}
            roomType={single(searchParams.roomType)}
          />
        )}
      </div>
    </div>
  );
}
