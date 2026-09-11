import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet";
import { getCanonicalUrl, createBreadcrumbSchema } from "@/lib/seo";
const PrivacyPolicy = () => {
  const navigate = useNavigate();
  
  const canonicalUrl = getCanonicalUrl('privacy-policy');
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: getCanonicalUrl('') },
    { name: "Privacy Policy", url: canonicalUrl }
  ]);
  
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Quizabl</title>
        <meta name="description" content="Read Quizabl's privacy policy. Learn how we protect your data and student information in compliance with COPPA and GDPR." />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content="Privacy Policy - Quizabl" />
        <meta property="og:description" content="Learn how Quizabl protects your data and student information." />
        <meta property="og:site_name" content="Quizabl" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content="Privacy Policy - Quizabl" />
        <meta name="twitter:description" content="Learn how Quizabl protects your data and student information." />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center shadow-none">
              <span className="text-primary-foreground font-bold text-lg">Q</span>
            </div>
            <h1 className="font-display italic text-2xl text-foreground">
              Quizabl
            </h1>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="font-display italic text-4xl md:text-5xl mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: October 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="font-display italic text-2xl mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Quizabl collects information to provide and improve our educational services:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Account Information:</strong> Email address, name, and password when you create an account</li>
              <li><strong>Usage Data:</strong> Information about how you use Quizabl, including quizzes created, games played, and analytics</li>
              <li><strong>Student Data:</strong> Student names (provided voluntarily) and quiz responses for analytics purposes</li>
              <li><strong>Payment Information:</strong> Billing details processed securely through our payment processor</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use collected information to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide and maintain our educational services</li>
              <li>Generate AI-powered content for your quizzes and games</li>
              <li>Provide analytics and insights on student performance</li>
              <li>Process payments and manage subscriptions</li>
              <li>Communicate with you about service updates and support</li>
              <li>Improve our services and develop new features</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">3. Student Privacy & COPPA Compliance</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We are committed to protecting student privacy:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Students do not need to create accounts to participate in quizzes</li>
              <li>Student names are provided voluntarily by students or teachers</li>
              <li>We do not collect personal information from students under 13 without parental consent</li>
              <li>Student data is used solely for educational purposes and analytics</li>
              <li>We never sell or share student data with third parties for marketing</li>
              <li>Teachers control all student data and can delete it at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">4. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your data, including encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">5. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Quizabl uses trusted third-party services:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Supabase:</strong> Database and authentication services</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>AI Services:</strong> Content generation (OpenAI, Google Gemini)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              These services have their own privacy policies and we ensure they meet our data protection standards.
            </p>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">6. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to maintain user sessions, remember preferences, and analyze site usage. You can control cookie settings through your browser.
            </p>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">8. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data as long as your account is active or as needed to provide services. You can request deletion of your account and associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or prominent notice on our website.
            </p>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>Email:</strong> support@quizabl.com
            </p>
          </section>
        </div>
      </main>
      </div>
    </>
  );
};
export default PrivacyPolicy;