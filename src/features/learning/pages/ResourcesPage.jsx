import { m } from 'framer-motion';
import { Library } from 'lucide-react';
import ResourcesSection from '@/components/resources/ResourcesSection';
import DocumentHead from '@/components/shared/DocumentHead';
import { MUTED, Pill } from '@/features/dashboard/components/primitives';

const ResourcesPage = () => {
  return (
    <>
      <DocumentHead
        title="Free IELTS Study Resources & Preparation Materials"
        description="Access our collection of free IELTS study materials, expert guides, sample essays, speaking topics, and academic resources to boost your band score and prepare effectively."
        canonicalUrl="https://www.ieltsai.pro/resources"
        keywords="free IELTS resources, IELTS materials, study guides, IELTS samples, preparation materials"
      />

      <main className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 md:px-5 md:py-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.10] dark:opacity-[0.14]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 z-0 h-112 w-112 rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
        />

        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mx-auto max-w-[1600px] space-y-4"
        >
          <header className="mb-1 flex flex-wrap items-end justify-between gap-3 border-b border-[#eeedf7] pb-4 dark:border-white/[0.07]">
            <div>
              <Pill tone="accent">
                <Library className="h-3 w-3" />
                Knowledge base
              </Pill>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Study Resources
              </h1>
              <p className={`mt-1 max-w-xl text-sm font-medium ${MUTED}`}>
                Curated collection of high-quality IELTS learning materials.
              </p>
            </div>
          </header>

          <ResourcesSection />
        </m.div>
      </main>
    </>
  );
};

export default ResourcesPage;
