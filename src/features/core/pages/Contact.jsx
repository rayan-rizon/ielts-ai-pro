import React, { useState } from 'react';
import { m } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Mail, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import Navbar from '@/features/core/components/landing/Navbar';
import Footer from '@/features/core/components/landing/Footer';
import DocumentHead from '@/components/shared/DocumentHead';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/features/auth/context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function Contact() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handlePrimaryCta = () =>
    navigate(user && !authLoading ? createPageUrl('Dashboard') : createPageUrl('Login'));
  const handlePricing = () => navigate(createPageUrl('Pricing'));

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.target);
    const name = formData.get('name');
    const topic = formData.get('topic');
    const message = formData.get('message');

    // Construct mailto link
    const mailtoLink = `mailto:mail@ieltsai.pro?subject=[${topic}] Inquiry from ${name}&body=${encodeURIComponent(message)}`;

    // Open email client
    window.location.href = mailtoLink;

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success('Opening your email client to send the message...');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <DocumentHead
        title="Contact IELTS Ai Pro Support & Help Center"
        description="Get in touch with our IELTS support team for help with your preparation plan, pricing questions, or technical issues. Available to assist your Band 7+ journey."
        canonicalUrl="https://www.ieltsai.pro/contact"
        keywords="contact IELTS Ai Pro, customer support, IELTS help, contact us"
      />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <Navbar
        isDark={theme === 'dark'}
        setTheme={setTheme}
        handlePricing={handlePricing}
        handlePrimaryCta={handlePrimaryCta}
        isSignedIn={Boolean(user && !authLoading)}
      />

      <main className="pt-24 pb-16 relative z-10">
        <section className="py-12 md:py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
              {/* Left Column: Info & Context */}
              <m.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-12"
              >
                <div className="space-y-6">
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest leading-none"
                  >
                    Contact Us
                  </Badge>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                    We'd love to <br />
                    <span className="text-gradient-primary">hear from you.</span>
                  </h1>
                  <p className="body-lg text-muted-foreground max-w-lg leading-relaxed">
                    Whether you're stuck on a feature, need help with your plan, or just want to
                    share your success story, we're ready to listen.
                  </p>
                </div>

                <div className="grid gap-6">
                  <Card className="p-6 flex items-start gap-5 bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-colors group">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Email Support</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        Best for detailed inquiries & account issues.
                      </p>
                      <a
                        href="mailto:mail@ieltsai.pro"
                        className="text-primary font-bold hover:underline"
                      >
                        mail@ieltsai.pro
                      </a>
                    </div>
                  </Card>

                  <Card className="p-6 flex items-start gap-5 bg-card/50 backdrop-blur-sm border-indigo-500/10 hover:border-indigo-500/20 transition-colors group">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform duration-300">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Live Chat</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        Instant answers for quick questions.
                      </p>
                      <span className="inline-flex items-center text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                        Available 9am - 6pm GMT
                      </span>
                    </div>
                  </Card>
                </div>
              </m.div>

              {/* Right Column: Contact Form */}
              <m.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-indigo-500/10 to-transparent blur-3xl -z-10 rounded-[3rem] opacity-60" />

                <Card className="p-8 md:p-10 bg-background/60 backdrop-blur-3xl border-white/10 shadow-2xl relative overflow-hidden rounded-[2.5rem] dark:bg-card/40">
                  {isSubmitted ? (
                    <div className="flex flex-col items-center text-center py-20 space-y-8 animate-in fade-in zoom-in duration-300">
                      <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/10">
                        <CheckCircle2 className="w-12 h-12" />
                      </div>
                      <div className="space-y-3 max-w-xs mx-auto">
                        <h3 className="text-3xl font-black">Opening Mail Client...</h3>
                        <p className="text-muted-foreground font-medium leading-relaxed">
                          Please complete sending the message from your email regarding "
                          {new FormData(document.querySelector('form')).get('topic') ||
                            'your inquiry'}
                          ".
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => setIsSubmitted(false)}
                        className="rounded-xl px-8 h-12 font-bold"
                      >
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2 mb-8">
                        <h3 className="text-2xl font-black">Send us a message</h3>
                        <p className="text-muted-foreground text-sm">
                          Fill out the form below and we'll get back to you shortly.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                            Name
                          </label>
                          <Input
                            name="name"
                            required
                            placeholder="Your Name"
                            className="h-12 bg-white/40 dark:bg-black/20 border-border/50 rounded-xl focus:ring-primary/20 font-medium transition-all focus:bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                            Email
                          </label>
                          <Input
                            name="email"
                            required
                            type="email"
                            placeholder="you@company.com"
                            className="h-12 bg-white/40 dark:bg-black/20 border-border/50 rounded-xl focus:ring-primary/20 font-medium transition-all focus:bg-background"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                          Topic
                        </label>
                        <select
                          name="topic"
                          className="flex h-12 w-full items-center justify-between rounded-xl border border-border/50 bg-white/40 dark:bg-black/20 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-medium transition-all focus:bg-background appearance-none"
                        >
                          <option>General Inquiry</option>
                          <option>Technical Support</option>
                          <option>Billing & Pricing</option>
                          <option>Feature Request</option>
                          <option>Partnership</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                          Message
                        </label>
                        <Textarea
                          name="message"
                          required
                          placeholder="How can we help you?"
                          className="min-h-[160px] bg-white/40 dark:bg-black/20 border-border/50 rounded-2xl focus:ring-primary/20 font-medium resize-none p-4 text-base transition-all focus:bg-background"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-blue-600 hover:to-blue-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2 group"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Send Message{' '}
                            <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        )}
                      </Button>
                    </form>
                  )}
                </Card>
              </m.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-primary text-primary-foreground rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl center text-center"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />

              <h2 className="text-3xl md:text-4xl font-black mb-6 relative z-10">
                Ready to start learning?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto relative z-10">
                Join thousands of students achieving their dream IELTS scores with our AI-powered
                platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <Button
                  onClick={() => navigate('/signup')}
                  className="h-14 px-8 rounded-full bg-white text-primary hover:bg-white/90 font-black text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  Get Started Free
                </Button>
                <Button
                  onClick={() => navigate('/pricing')}
                  variant="outline"
                  className="h-14 px-8 rounded-full border-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white hover:border-white/40 font-bold text-lg"
                >
                  View Pricing
                </Button>
              </div>
            </m.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
