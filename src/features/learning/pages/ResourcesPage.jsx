import { motion } from 'framer-motion';
import { Library } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ResourcesSection from '@/components/resources/ResourcesSection';
import DocumentHead from '@/components/shared/DocumentHead';

const ResourcesPage = () => {
  return (
    <>
      <DocumentHead
        title="Free IELTS Study Resources & Preparation Materials"
        description="Access our collection of free IELTS study materials, expert guides, sample essays, speaking topics, and academic resources to boost your band score and prepare effectively."
        canonicalUrl="https://www.ieltsai.pro/resources"
        keywords="free IELTS resources, IELTS materials, study guides, IELTS samples, preparation materials"
        data-oid="hk4mwcy"
      />

      <div
        className="relative min-h-screen pb-20 bg-slate-50 dark:bg-[#020617] transition-colors duration-500 overflow-hidden font-sans"
        data-oid="6dmv-sz"
      >
        {/* Premium Dark Mode Background */}
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
          data-oid="88:.ob-"
        >
          {/* Soft Indigo/Slate Blobs for depth */}
          <div
            className="absolute top-[-10%] left-[-10%] w-[70rem] h-[70rem] rounded-full bg-slate-200/30 dark:bg-indigo-950/20 blur-[120px]"
            data-oid="pjamyb9"
          />

          <div
            className="absolute bottom-[-20%] right-[-10%] w-[60rem] h-[60rem] rounded-full bg-indigo-100/20 dark:bg-slate-900/10 blur-[120px]"
            data-oid="35-e5i-"
          />

          <div
            className="absolute top-[20%] right-[10%] w-[40rem] h-[40rem] rounded-full bg-slate-200/10 dark:bg-slate-900/15 blur-[80px]"
            data-oid="ubq5:ez"
          />

          {/* Dark Mode Specific Center Glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-0 dark:opacity-40 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)]"
            data-oid="52:k310"
          />

          {/* Subtle Mono Mesh Gradient */}
          <div
            className="absolute inset-0 opacity-[0.2] dark:opacity-40 bg-[radial-gradient(at_top_left,rgba(71,85,105,0.05)_0%,transparent_50%),radial-gradient(at_bottom_right,rgba(30,41,59,0.05)_0%,transparent_50%)]"
            data-oid="q8iqhj_"
          />

          {/* Subtle Grid Pattern */}
          <div
            className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:48px_48px]"
            data-oid="0l5lnm1"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="px-4 md:px-6 lg:px-8 py-4 max-w-[1600px] mx-auto space-y-4 relative z-10"
          data-oid="8prm6dg"
        >
          {/* Sleek Compact Header */}
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-4"
            data-oid="iixbui7"
          >
            <div className="space-y-1" data-oid="k41if6d">
              <div className="flex items-center gap-2" data-oid="62ibgsb">
                <div
                  className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-1.5 rounded-lg shadow-md shadow-indigo-500/10"
                  data-oid="peh5sfz"
                >
                  <Library className="w-4 h-4 text-white" data-oid="ji33vwg" />
                </div>
                <Badge
                  className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 rounded-full font-bold text-[10px]"
                  data-oid=":vsca_o"
                >
                  Knowledge Base
                </Badge>
              </div>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-slate-900 dark:text-white"
                data-oid="r2_677b"
              >
                Study Resources
              </h1>
              <p
                className="text-slate-500 dark:text-slate-400 text-xs font-medium max-w-xl"
                data-oid="w5462zz"
              >
                Curated collection of high-quality IELTS learning materials.
              </p>
            </div>

            <div className="flex items-center gap-2" data-oid="uywub_n">
              <div className="flex -space-x-2" data-oid="lqfnbt-">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-slate-50 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 overflow-hidden shadow-sm"
                    data-oid="c456i9g"
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`}
                      alt="Learner"
                      className="w-full h-full object-cover"
                      data-oid="h8i3012"
                    />
                  </div>
                ))}
              </div>
              <span
                className="text-xs font-semibold text-slate-500 dark:text-slate-400"
                data-oid="22etpkf"
              >
                <span
                  className="text-indigo-600 dark:text-indigo-400 font-black"
                  data-oid="3f5iw38"
                >
                  12k+
                </span>{' '}
                learners
              </span>
            </div>
          </div>

          <ResourcesSection data-oid="m_aw6m:" />
        </motion.div>
      </div>
    </>
  );
};

export default ResourcesPage;
