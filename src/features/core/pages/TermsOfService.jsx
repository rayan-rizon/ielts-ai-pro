import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Scale, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DocumentHead from '@/components/shared/DocumentHead';

const TermsOfService = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content:
        'By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this websites particular services, you shall be subject to any posted guidelines or rules applicable to such services.',
    },
    {
      title: '2. Use License',
      content:
        "Permission is granted to temporarily download one copy of the materials (information or software) on IELTS Ai Pro's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials; use the materials for any commercial purpose, or for any public display (commercial or non-commercial); attempt to decompile or reverse engineer any software contained on IELTS Ai Pro's website.",
    },
    {
      title: '3. Disclaimer',
      content:
        "The materials on IELTS Ai Pro's website are provided 'as is'. IELTS Ai Pro makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.",
    },
    {
      title: '4. Limitations',
      content:
        "In no event shall IELTS Ai Pro or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on IELTS Ai Pro's website, even if IELTS Ai Pro or a IELTS Ai Pro authorized representative has been notified orally or in writing of the possibility of such damage.",
    },
    {
      title: '5. Revisions and Errata',
      content:
        "The materials appearing on IELTS Ai Pro's website could include technical, typographical, or photographic errors. IELTS Ai Pro does not warrant that any of the materials on its website are accurate, complete, or current. IELTS Ai Pro may make changes to the materials contained on its website at any time without notice.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <DocumentHead
        title="Terms of Service & Usage Policy | IELTS Ai Pro"
        description="Review the terms of service for using IELTS Ai Pro, including licensing, disclaimers, and limitations of liability for our AI-powered IELTS preparation platform."
        canonicalUrl="https://www.ieltsai.pro/terms"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Terms of Service - IELTS Ai Pro',
          description:
            'Terms and conditions for using IELTS Ai Pro AI-powered IELTS preparation services.',
          url: 'https://www.ieltsai.pro/terms',
          publisher: {
            '@type': 'Organization',
            name: 'IELTS Ai Pro',
          },
        }}
        data-oid="h2wvu5z"
      />

      <div
        className="min-h-screen bg-background text-foreground relative overflow-hidden selection:bg-primary/20"
        data-oid="6vqubkx"
      >
        {/* Background Gradients */}
        <div className="fixed inset-0 pointer-events-none" data-oid="rj11se3">
          <div
            className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
            data-oid="arz-l85"
          />

          <div
            className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
            data-oid="k598thc"
          />
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl" data-oid="ufto6vn">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
            data-oid="o2wph.7"
          >
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-6 hover:bg-background/80 hover:scale-105 transition-all duration-300"
              data-oid="ngiqpg8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" data-oid="-7pe0pa" />
              Back
            </Button>
            <div
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6"
              data-oid="9xgh3mo"
            >
              <div data-oid="pldsf3g">
                <h1
                  className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 mb-2"
                  data-oid="w7no-8o"
                >
                  Terms of Service
                </h1>
                <p className="text-muted-foreground" data-oid="q7uh1yc">
                  Last updated:{' '}
                  {new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div
                className="p-4 rounded-2xl bg-primary/10 backdrop-blur-sm border border-primary/20"
                data-oid="zf__a4b"
              >
                <Scale className="w-8 h-8 text-primary" data-oid="gj4mj3j" />
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6"
            data-oid="08lbkos"
          >
            <motion.div
              variants={itemVariants}
              className="glass-card p-6 md:p-8 rounded-2xl"
              data-oid="ropt7am"
            >
              <p className="text-lg leading-relaxed text-muted-foreground" data-oid="969ly66">
                Welcome to IELTS Ai Pro. Please read these terms carefully before participating in
                our learning programs or using our services.
              </p>
            </motion.div>

            {sections.map((section, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 bg-card/30 hover:bg-card/50 transition-colors duration-300"
                data-oid="ygod5sg"
              >
                <h2
                  className="text-xl font-semibold mb-4 flex items-center gap-2"
                  data-oid="jgqfqj-"
                >
                  <span
                    className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold"
                    data-oid="xxud8l_"
                  >
                    {index + 1}
                  </span>
                  {section.title.split('. ')[1]}
                </h2>
                <p className="text-muted-foreground leading-relaxed pl-10" data-oid="gdd3ob-">
                  {section.content}
                </p>
              </motion.div>
            ))}

            <motion.div
              variants={itemVariants}
              className="glass-card p-6 md:p-8 rounded-2xl bg-primary/5 border border-primary/10"
              data-oid="4ox53_7"
            >
              <h2
                className="text-xl font-semibold mb-4 flex items-center gap-2 text-primary"
                data-oid="7pv:0_u"
              >
                <FileText className="w-5 h-5" data-oid="x1ozaev" />
                Contact Us
              </h2>
              <p className="text-muted-foreground" data-oid="t47j:ws">
                If you have any questions about these Terms, please contact us at mail@ieltsai.pro
              </p>
            </motion.div>
          </motion.div>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 text-center text-sm text-muted-foreground/60 pb-8"
            data-oid="lni25qb"
          >
            &copy; {new Date().getFullYear()} IELTS Ai Pro. All rights reserved.
          </motion.footer>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;
