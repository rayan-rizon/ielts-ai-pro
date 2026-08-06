import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  Database,
  Globe,
  Scale,
  FileWarning,
  Trash2,
  Users,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DocumentHead from '@/components/shared/DocumentHead';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Eye,
      title: 'Information Collection',
      content: (
        <>
          <p className="mb-4" data-oid="nx-6rv7">
            We collect information from you when you register on our site, subscribe to our
            newsletter, respond to a survey or fill out a form. When ordering or registering on our
            site, you may be asked to provide:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground" data-oid="vxufb4.">
            <li data-oid="n-7b5is">Name and email address</li>
            <li data-oid="moy18l-">IELTS test goals and target scores</li>
            <li data-oid="l-khitt">Test performance data and answers</li>
            <li data-oid="bnr06l9">Usage analytics and interaction patterns</li>
            <li data-oid="3fegsit">Payment information (processed securely via Stripe)</li>
          </ul>
        </>
      ),
    },
    {
      icon: Scale,
      title: 'Lawful Basis for Processing (GDPR Article 6)',
      content: (
        <>
          <p className="mb-4" data-oid="k:h3cd4">
            We process your personal data under the following legal bases:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground" data-oid="u2463ir">
            <li data-oid="_6t7zaf">
              <strong data-oid="rh9vn9h">Contractual Necessity:</strong> To provide you with our
              IELTS preparation services, process your test submissions, and deliver AI-powered
              feedback.
            </li>
            <li data-oid="2mn86ro">
              <strong data-oid="b:n908m">Legitimate Interest:</strong> To improve our services,
              analyze usage patterns, and enhance user experience while maintaining appropriate
              safeguards.
            </li>
            <li data-oid="rems6vb">
              <strong data-oid="v4rxw04">Consent:</strong> For marketing communications and
              non-essential analytics cookies. You may withdraw consent at any time.
            </li>
            <li data-oid="6yoks28">
              <strong data-oid="lw7j6:i">Legal Obligation:</strong> To comply with applicable laws,
              such as tax regulations for paid subscriptions.
            </li>
          </ul>
        </>
      ),
    },
    {
      icon: Database,
      title: 'Data We Process',
      content: (
        <>
          <p className="mb-4" data-oid=".74ewui">
            We process the following categories of personal data:
          </p>
          <div className="grid md:grid-cols-2 gap-4" data-oid="itenvzu">
            <div
              className="p-4 rounded-xl bg-background/50 border border-border/30"
              data-oid=".39gsii"
            >
              <h4 className="font-semibold mb-2" data-oid="dt-ibn-">
                Account Data
              </h4>
              <p className="text-sm text-muted-foreground" data-oid="nv_fwf_">
                Email, username, profile picture, subscription status
              </p>
            </div>
            <div
              className="p-4 rounded-xl bg-background/50 border border-border/30"
              data-oid="_vpo9eq"
            >
              <h4 className="font-semibold mb-2" data-oid="s_v_1:0">
                Performance Data
              </h4>
              <p className="text-sm text-muted-foreground" data-oid="3ri8z9g">
                Test scores, answers, AI feedback, learning progress
              </p>
            </div>
            <div
              className="p-4 rounded-xl bg-background/50 border border-border/30"
              data-oid="cp:zsl:"
            >
              <h4 className="font-semibold mb-2" data-oid="6ild__m">
                Technical Data
              </h4>
              <p className="text-sm text-muted-foreground" data-oid="yo5jy54">
                IP address, browser type, device info, usage logs
              </p>
            </div>
            <div
              className="p-4 rounded-xl bg-background/50 border border-border/30"
              data-oid="ujjsjni"
            >
              <h4 className="font-semibold mb-2" data-oid="uq6-5bu">
                Consent Records
              </h4>
              <p className="text-sm text-muted-foreground" data-oid="eje:6lx">
                Cookie preferences, marketing opt-ins, timestamps
              </p>
            </div>
          </div>
        </>
      ),
    },
    {
      icon: Lock,
      title: 'Data Security & Encryption',
      content: (
        <>
          <p className="mb-4" data-oid="qauja.o">
            We implement industry-standard security measures:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground" data-oid="itwssfx">
            <li data-oid="veko5od">
              <strong data-oid="vzehx8j">Encryption in Transit:</strong> All data transmitted via
              TLS 1.3 (HTTPS)
            </li>
            <li data-oid="5ahoe5n">
              <strong data-oid="ay:halz">Encryption at Rest:</strong> Database encrypted using
              AES-256
            </li>
            <li data-oid="6zoawb2">
              <strong data-oid="f469kzb">Access Controls:</strong> Row-Level Security (RLS) ensures
              users can only access their own data
            </li>
            <li data-oid="k09sc1i">
              <strong data-oid="i1qoa8m">Secure Authentication:</strong> JWT-based authentication
              with automatic token refresh
            </li>
            <li data-oid="y6d_xvj">
              <strong data-oid="j32o:ph">Payment Security:</strong> All payments processed via
              Stripe (PCI DSS compliant)
            </li>
            <li data-oid="00geukd">
              <strong data-oid="a0p_1ro">CSRF Protection:</strong> Cross-site request forgery
              prevention on all API endpoints
            </li>
          </ul>
        </>
      ),
    },
    {
      icon: Users,
      title: 'Your Rights (GDPR & CCPA)',
      content: (
        <>
          <p className="mb-4" data-oid="lo.txao">
            You have the following rights regarding your personal data:
          </p>
          <div className="space-y-3" data-oid="nvgzdc3">
            <div
              className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
              data-oid="5hfz3io"
            >
              <strong className="text-blue-500" data-oid="h1v9mqo">
                Right to Access:
              </strong>
              <span className="text-muted-foreground ml-2" data-oid="..oyv9g">
                Download all your data via Settings → Privacy → Download My Data
              </span>
            </div>
            <div
              className="p-3 rounded-lg bg-green-500/10 border border-green-500/20"
              data-oid=":viq88t"
            >
              <strong className="text-green-500" data-oid="-m5mqbn">
                Right to Rectification:
              </strong>
              <span className="text-muted-foreground ml-2" data-oid="rl9kws2">
                Update your profile information at any time in Settings
              </span>
            </div>
            <div
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              data-oid="qujgkae"
            >
              <strong className="text-red-500" data-oid="gr:pyaf">
                Right to Erasure:
              </strong>
              <span className="text-muted-foreground ml-2" data-oid="0nacm9w">
                Delete your account permanently via Settings → Account → Delete Account
              </span>
            </div>
            <div
              className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20"
              data-oid="632spih"
            >
              <strong className="text-purple-500" data-oid="lpi34h9">
                Right to Data Portability:
              </strong>
              <span className="text-muted-foreground ml-2" data-oid="tfcua4a">
                Export your data in machine-readable JSON format
              </span>
            </div>
            <div
              className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
              data-oid="vz6qygc"
            >
              <strong className="text-amber-500" data-oid="p51tha4">
                Right to Object (CCPA):
              </strong>
              <span className="text-muted-foreground ml-2" data-oid="x0xh22e">
                Opt out of data selling (we do NOT sell your data)
              </span>
            </div>
          </div>
        </>
      ),
    },
    {
      icon: Trash2,
      title: 'Account Deletion & Data Wiping',
      content: (
        <>
          <p className="mb-4" data-oid="xsay95p">
            <strong data-oid="h9.pi38">
              When you delete your account, the following data is permanently removed:
            </strong>
          </p>
          <ul
            className="list-disc list-inside space-y-2 text-muted-foreground mb-4"
            data-oid=".f3emk6"
          >
            <li data-oid=".07t9hq">Your user profile and authentication credentials</li>
            <li data-oid="smykp50">All test sessions, scores, and performance history</li>
            <li data-oid=":tslizr">AI feedback and writing/speaking submissions</li>
            <li data-oid="cdkr-6u">Vocabulary lists and learning progress</li>
            <li data-oid="wldcf-i">Achievement records and gamification data</li>
            <li data-oid="ekt05__">Consent history and preference records</li>
          </ul>
          <div
            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
            data-oid="d.t1d76"
          >
            <div className="flex items-start gap-3" data-oid="4x.vrsa">
              <AlertTriangle
                className="w-5 h-5 text-amber-500 mt-0.5 shrink-0"
                data-oid="c6qmouz"
              />

              <div data-oid="y_bkts0">
                <p className="font-semibold text-amber-500 mb-1" data-oid="u6a_gup">
                  Important Notice
                </p>
                <p className="text-sm text-muted-foreground" data-oid="q:13efp">
                  Account deletion is <strong data-oid="c1:6wkz">permanent and irreversible</strong>
                  . All data is deleted within 30 days, though some anonymized usage statistics may
                  be retained for service improvement. Backup copies are purged within 90 days per
                  our retention schedule.
                </p>
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      icon: FileWarning,
      title: 'Data Breach Notification Policy',
      content: (
        <>
          <p className="mb-4" data-oid="67y5wsz">
            In compliance with GDPR Article 33-34, we maintain a comprehensive incident response
            plan:
          </p>
          <div className="space-y-4" data-oid="mpypg64">
            <div
              className="p-4 rounded-xl bg-red-500/5 border border-red-500/10"
              data-oid="oun268o"
            >
              <h4 className="font-semibold text-red-500 mb-2" data-oid="ckcsy-2">
                72-Hour Notification
              </h4>
              <p className="text-sm text-muted-foreground" data-oid="somyago">
                In the event of a personal data breach, we will notify the relevant supervisory
                authority within 72 hours of becoming aware of the breach, unless the breach is
                unlikely to result in a risk to individuals' rights and freedoms.
              </p>
            </div>
            <div
              className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10"
              data-oid="dpqm5bw"
            >
              <h4 className="font-semibold text-blue-500 mb-2" data-oid="0.8hxav">
                User Notification
              </h4>
              <p className="text-sm text-muted-foreground" data-oid="bozeh8x">
                If a breach is likely to result in high risk to your rights and freedoms, we will
                communicate the breach to you directly via email without undue delay, including:
              </p>
              <ul
                className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1"
                data-oid=".4.l8g8"
              >
                <li data-oid="wuo.fbh">Nature of the breach and data affected</li>
                <li data-oid="bzy72.t">Contact details of our data protection team</li>
                <li data-oid="v8ldcnd">Likely consequences and mitigation measures</li>
                <li data-oid="4:wz2:u">Steps you can take to protect yourself</li>
              </ul>
            </div>
            <div
              className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
              data-oid=".4zetmg"
            >
              <h4 className="font-semibold text-emerald-500 mb-2" data-oid="-x_yn:j">
                Incident Response Team
              </h4>
              <p className="text-sm text-muted-foreground" data-oid="um4hrg8">
                Our security team continuously monitors for potential breaches. All incidents are
                documented, investigated, and remediated according to our incident response
                procedures.
              </p>
            </div>
          </div>
        </>
      ),
    },
    {
      icon: Globe,
      title: 'International Data Transfers',
      content: (
        <>
          <p className="mb-4" data-oid="1osf5ty">
            Your data may be processed in the following locations:
          </p>
          <ul
            className="list-disc list-inside space-y-2 text-muted-foreground mb-4"
            data-oid="7fz.0n-"
          >
            <li data-oid="0j073ov">
              <strong data-oid="uqqfemv">Supabase:</strong> Database and authentication (US/EU
              regions)
            </li>
            <li data-oid="zi0f_s7">
              <strong data-oid="d5my8np">Vercel:</strong> Website hosting (Global CDN with EU
              presence)
            </li>
            <li data-oid="5z8firj">
              <strong data-oid="bjndtvb">Stripe:</strong> Payment processing (PCI DSS compliant,
              EU/US)
            </li>
            <li data-oid="y32zlkx">
              <strong data-oid="_uc3j8l">Google AI:</strong> AI-powered feedback generation (US)
            </li>
          </ul>
          <p className="text-sm text-muted-foreground" data-oid="5x6j:xh">
            For transfers outside the EEA, we rely on Standard Contractual Clauses (SCCs) and ensure
            adequate safeguards are in place to protect your data.
          </p>
        </>
      ),
    },
    {
      icon: Shield,
      title: 'Data Retention',
      content: (
        <>
          <p className="mb-4" data-oid="_6jif0a">
            We retain your data for the following periods:
          </p>
          <div className="overflow-x-auto" data-oid="p88xr42">
            <table className="w-full text-sm" data-oid="5_u8vzd">
              <thead data-oid="9_h9ak_">
                <tr className="border-b border-border/30" data-oid="0l3-myy">
                  <th className="text-left py-2 font-semibold" data-oid="32xzzun">
                    Data Type
                  </th>
                  <th className="text-left py-2 font-semibold" data-oid="8b-egmb">
                    Retention Period
                  </th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground" data-oid="qyishih">
                <tr className="border-b border-border/20" data-oid="ne6:ito">
                  <td className="py-2" data-oid=":ehbmlc">
                    Account & Profile Data
                  </td>
                  <td className="py-2" data-oid="5a64i92">
                    Until account deletion + 30 days
                  </td>
                </tr>
                <tr className="border-b border-border/20" data-oid="z450..l">
                  <td className="py-2" data-oid="iz_xhzl">
                    Test Performance Data
                  </td>
                  <td className="py-2" data-oid="d5u7sxc">
                    Until account deletion
                  </td>
                </tr>
                <tr className="border-b border-border/20" data-oid="a2c8bbf">
                  <td className="py-2" data-oid="oo58g73">
                    Payment Records
                  </td>
                  <td className="py-2" data-oid="kl8-k1f">
                    7 years (legal requirement)
                  </td>
                </tr>
                <tr className="border-b border-border/20" data-oid=":x54red">
                  <td className="py-2" data-oid="2ysi5c0">
                    Consent Records
                  </td>
                  <td className="py-2" data-oid="io7hr-c">
                    Until account deletion + 3 years
                  </td>
                </tr>
                <tr className="border-b border-border/20" data-oid="6l573aj">
                  <td className="py-2" data-oid="f2mw62z">
                    Security Logs
                  </td>
                  <td className="py-2" data-oid="izmc2ce">
                    90 days
                  </td>
                </tr>
                <tr data-oid="s6m1ogj">
                  <td className="py-2" data-oid="vawpej0">
                    Backup Data
                  </td>
                  <td className="py-2" data-oid="-_zqzwi">
                    90 days after deletion
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      icon: Mail,
      title: 'Contact & Data Protection Officer',
      content: (
        <>
          <p className="mb-4" data-oid="2:sdzqj">
            For any privacy-related inquiries or to exercise your rights, contact us:
          </p>
          <div className="grid md:grid-cols-2 gap-4" data-oid=".7t_u:x">
            <div
              className="p-4 rounded-xl bg-background/50 border border-border/30"
              data-oid="y2ba7eg"
            >
              <h4 className="font-semibold mb-2" data-oid="rhp6m0b">
                General Inquiries
              </h4>
              <p className="text-sm text-muted-foreground" data-oid="c7zn7ii">
                mail@ieltsai.pro
              </p>
            </div>
            <div
              className="p-4 rounded-xl bg-background/50 border border-border/30"
              data-oid="dfia8pu"
            >
              <h4 className="font-semibold mb-2" data-oid="f_8md-q">
                Data Protection Officer
              </h4>
              <p className="text-sm text-muted-foreground" data-oid="q_-gshi">
                mail@ieltsai.pro
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground" data-oid="878p9q2">
            We will respond to all privacy requests within 30 days. If you are unsatisfied with our
            response, you have the right to lodge a complaint with your local data protection
            authority.
          </p>
        </>
      ),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
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
        title="Privacy Policy & Data Security | IELTS Ai Pro"
        description="Read the IELTS Ai Pro privacy policy to understand how we collect, use, and protect your personal data in compliance with GDPR and CCPA regulations."
        canonicalUrl="https://www.ieltsai.pro/privacy"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Privacy Policy - IELTS Ai Pro',
          description:
            'GDPR and CCPA compliant privacy policy for IELTS Ai Pro AI-powered IELTS preparation platform.',
          url: 'https://www.ieltsai.pro/privacy',
          publisher: {
            '@type': 'Organization',
            name: 'IELTS Ai Pro',
          },
        }}
        data-oid="s-_5n0s"
      />

      <div
        className="min-h-screen bg-background text-foreground relative overflow-hidden selection:bg-purple-500/30"
        data-oid="qo4yntj"
      >
        {/* Background Gradients */}
        <div className="fixed inset-0 pointer-events-none" data-oid="emm9epe">
          <div
            className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"
            data-oid="rxt2pwb"
          />

          <div
            className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"
            data-oid="adegk-u"
          />
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl" data-oid="3-0:xiu">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
            data-oid="03:29zt"
          >
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-6 hover:bg-background/80 hover:scale-105 transition-all duration-300"
              data-oid="kexy1r5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" data-oid="d5uldo6" />
              Back
            </Button>
            <div
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6"
              data-oid="aplbtgu"
            >
              <div data-oid="v.11s-b">
                <h1
                  className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r/srgb from-blue-600 to-purple-600 mb-2"
                  data-oid="o-c54d3"
                >
                  Privacy Policy
                </h1>
                <p className="text-muted-foreground" data-oid="mfats1m">
                  Last updated: January 18, 2026 | Version 2.0 (GDPR & CCPA Compliant)
                </p>
              </div>
              <div
                className="p-4 rounded-2xl bg-blue-500/10 backdrop-blur-sm border border-blue-500/20"
                data-oid="9rmewnp"
              >
                <Shield className="w-8 h-8 text-blue-500" data-oid="..:bi_x" />
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6"
            data-oid="8jz0qp9"
          >
            <motion.div
              variants={itemVariants}
              className="glass-card p-6 md:p-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5"
              data-oid="pvi5opq"
            >
              <p className="text-lg leading-relaxed text-muted-foreground" data-oid="0xh5-g9">
                At IELTS Ai Pro, your privacy is our priority. This policy outlines how we collect,
                use, protect, and share your personal information in compliance with the
                <strong className="text-emerald-500" data-oid="z6nmohx">
                  {' '}
                  General Data Protection Regulation (GDPR)
                </strong>{' '}
                and
                <strong className="text-emerald-500" data-oid="3fl6ha6">
                  {' '}
                  California Consumer Privacy Act (CCPA)
                </strong>
                .
              </p>
            </motion.div>

            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 bg-card/30 hover:bg-card/50 transition-colors duration-300"
                  data-oid="h90zv5j"
                >
                  <div className="flex flex-col gap-4" data-oid="fjut.c9">
                    <div className="flex items-center gap-4" data-oid="fsj80hb">
                      <div
                        className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"
                        data-oid="jym.7sb"
                      >
                        <Icon className="w-5 h-5 text-blue-500" data-oid="j36embm" />
                      </div>
                      <h2 className="text-xl font-semibold" data-oid="ul8ti.6">
                        {section.title}
                      </h2>
                    </div>
                    <div className="text-muted-foreground leading-relaxed" data-oid="grgbnq3">
                      {section.content}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <motion.div
              variants={itemVariants}
              className="glass-card p-6 md:p-8 rounded-2xl bg-blue-500/5 border border-blue-500/10"
              data-oid="0eoy4n7"
            >
              <h2
                className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-500"
                data-oid="gxrgit_"
              >
                <Lock className="w-5 h-5" data-oid="-khcaoz" />
                Your Consent
              </h2>
              <p className="text-muted-foreground" data-oid="7tixxbf">
                By using our site, you consent to our privacy policy. You may withdraw consent for
                non-essential processing at any time through Settings → Privacy, or by contacting us
                directly.
              </p>
            </motion.div>

            {/* CCPA Notice */}
            <motion.div
              variants={itemVariants}
              className="glass-card p-6 md:p-8 rounded-2xl bg-purple-500/5 border border-purple-500/10"
              data-oid=":9lqrn1"
            >
              <h2
                className="text-xl font-semibold mb-4 flex items-center gap-2 text-purple-500"
                data-oid="czzd_6v"
              >
                <Scale className="w-5 h-5" data-oid="zn6_gtx" />
                California Residents (CCPA)
              </h2>
              <p className="text-muted-foreground mb-4" data-oid="wjxhsvh">
                If you are a California resident, you have additional rights under the California
                Consumer Privacy Act:
              </p>
              <ul
                className="list-disc list-inside space-y-2 text-muted-foreground"
                data-oid="_4i85xz"
              >
                <li data-oid="kfj:5fk">
                  <strong data-oid="sqsf_7m">Do Not Sell:</strong> We do NOT sell your personal
                  information to third parties.
                </li>
                <li data-oid="hvhc43m">
                  <strong data-oid=".byg46k">Right to Know:</strong> Request disclosure of data
                  collected, used, and shared.
                </li>
                <li data-oid="468t:nu">
                  <strong data-oid="4kq1:_1">Right to Delete:</strong> Request deletion of your
                  personal information.
                </li>
                <li data-oid="217ex:k">
                  <strong data-oid="-1kkly2">Non-Discrimination:</strong> We will not discriminate
                  against you for exercising your rights.
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 text-center text-sm text-muted-foreground/60 pb-8"
            data-oid="tk_pn10"
          >
            &copy; {new Date().getFullYear()} IELTS Ai Pro. All rights reserved.
          </motion.footer>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
