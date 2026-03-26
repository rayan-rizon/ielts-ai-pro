import React from 'react';

// Skeleton with same background as main dashboard to prevent flash
export default function DashboardSkeleton() {
  return (
    <div className="relative min-h-screen pb-20 bg-slate-50 dark:bg-[#020617]" data-oid="2tfywz6">
      {/* Same background as main dashboard */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
        data-oid="vtipi8d"
      >
        {/* Modern Mesh Gradient Pattern */}
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(99,102,241,0.08)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(99,102,241,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(99,102,241,0.15)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(79,70,229,0.1)_0%,transparent_50%)]"
          data-oid="ykj4-t4"
        />

        {/* Subtle Accent Glows */}
        <div
          className="absolute top-0 left-1/4 w-full h-[500px] bg-indigo-500/[0.03] dark:bg-indigo-500/[0.05] blur-[100px] rounded-full"
          data-oid="yc2o9vk"
        />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf603_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf603_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)]"
          data-oid="mbgm-t5"
        />
      </div>

      <div
        className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 relative z-10"
        data-oid="_f750cz"
      >
        {/* Header skeleton */}
        <div className="space-y-6" data-oid="bp7qy8a">
          <div
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            data-oid="eqyivtj"
          >
            <div className="space-y-3" data-oid="j1n1-ev">
              <div
                className="h-6 w-32 bg-white/40 dark:bg-slate-800/40 rounded-full animate-pulse"
                data-oid="p9ggojk"
              />

              <div
                className="h-12 w-full max-w-[20rem] bg-white/40 dark:bg-slate-800/40 rounded-2xl animate-pulse"
                data-oid=":f1_lk."
              />

              <div
                className="h-6 w-full max-w-[28rem] bg-white/40 dark:bg-slate-800/40 rounded-xl animate-pulse"
                data-oid="c5:8r0m"
              />
            </div>

            <div
              className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4"
              data-oid=":z9ultx"
            >
              {/* Floating bar skeleton */}
              <div
                className="h-16 w-full xl:w-[450px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-2xl animate-pulse"
                data-oid="9kkyon:"
              />

              <div
                className="h-12 w-full sm:w-48 bg-white/40 dark:bg-slate-900/40 rounded-full animate-pulse"
                data-oid="bw6x-j6"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5 lg:gap-6" data-oid="rsn:ryi">
          {/* Row 1 */}
          <div className="col-span-12 lg:col-span-8" data-oid="v5eg63-">
            <div
              className="h-[320px] rounded-[2rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm animate-pulse"
              data-oid="8_54ypy"
            />
          </div>
          <div className="col-span-12 lg:col-span-4" data-oid="a43sk1f">
            <div
              className="h-[320px] rounded-[2rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm animate-pulse"
              data-oid="i181ob-"
            />
          </div>

          {/* Row 2 */}
          <div className="col-span-12 lg:col-span-8" data-oid="_4-lals">
            <div
              className="h-[280px] rounded-[2rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm animate-pulse"
              data-oid="gvoj_4q"
            />
          </div>
          <div className="col-span-12 lg:col-span-4" data-oid="i2rbluj">
            <div
              className="h-[280px] rounded-[2rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm animate-pulse"
              data-oid="e.-qypw"
            />
          </div>

          {/* Row 3 */}
          <div className="col-span-12 lg:col-span-5" data-oid="swk.4tm">
            <div className="grid grid-cols-2 gap-4" data-oid="c0i5cr8">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-[180px] rounded-2xl bg-white/40 dark:bg-slate-900/40 animate-pulse"
                  data-oid="wlpe::5"
                />
              ))}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4" data-oid="nzgh8n.">
            <div
              className="h-[400px] rounded-[2rem] bg-white/40 dark:bg-slate-900/40 animate-pulse"
              data-oid="drt8i86"
            />
          </div>
          <div className="col-span-12 lg:col-span-3" data-oid="oys2v05">
            <div
              className="h-[400px] rounded-[2rem] bg-white/40 dark:bg-slate-900/40 animate-pulse"
              data-oid=":s9hv08"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
