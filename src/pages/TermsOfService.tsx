import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet";
import { getCanonicalUrl, createBreadcrumbSchema } from "@/lib/seo";
const TermsOfService = () => {
  const navigate = useNavigate();
  
  const canonicalUrl = getCanonicalUrl('terms-of-service');
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: getCanonicalUrl('') },
    { name: "Terms of Service", url: canonicalUrl }
  ]);
  
  return (
    <>
      <Helmet>
        <title>Terms of Service - Quizabl</title>
        <meta name="description" content="Read Quizabl's terms of service. Understand your rights and responsibilities when using our AI-powered educational platform." />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content="Terms of Service - Quizabl" />
        <meta property="og:description" content="Understand your rights when using Quizabl's educational platform." />
        <meta property="og:site_name" content="Quizabl" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content="Terms of Service - Quizabl" />
        <meta name="twitter:description" content="Understand your rights when using Quizabl's educational platform." />
        
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
        <h1 className="font-display italic text-4xl md:text-5xl mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last Updated: October 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="font-display italic text-2xl mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Quizabl ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Quizabl is an AI-powered educational platform that enables teachers to create interactive quizzes, flashcards, matching games, and other learning activities. The Service includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>AI-generated educational content</li>
              <li>Quiz and game creation tools</li>
              <li>Student participation without account creation</li>
              <li>Real-time analytics and reporting</li>
              <li>Content sharing via links and QR codes</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To create content on Quizabl, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your password</li>
              <li>Notify us immediately of any unauthorized account use</li>
              <li>Be responsible for all activities under your account</li>
              <li>Not share your account with others</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">4. Acceptable Use Policy</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Create content that is illegal, harmful, or inappropriate for educational settings</li>
              <li>Harass, abuse, or harm students or other users</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Distribute malware or engage in hacking</li>
              <li>Attempt to reverse engineer or compromise the Service</li>
              <li>Use the Service for commercial purposes without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">5. Content Ownership</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>Your Content:</strong> You retain ownership of the content you create using Quizabl. By using the Service, you grant us a license to store, process, and display your content as necessary to provide the Service.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>AI-Generated Content:</strong> Content generated by AI based on your prompts is provided "as is." You are responsible for reviewing and validating AI-generated content for accuracy and appropriateness.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Student Responses:</strong> Student responses and data remain under your control. You can export or delete this data at any time.
            </p>
          </section>

          <section id="billing">
            <h2 className="font-display italic text-2xl mb-4">6. Subscription and Billing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>Free Tier:</strong> Quizabl offers a free tier with limited credits per month.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>Paid Subscriptions:</strong> Paid plans provide additional credits and features. Subscriptions are billed monthly or annually and automatically renew unless cancelled.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>Credits:</strong> Credits are used for AI-generated content. Unused credits do not roll over to the next billing period unless you upgrade your plan.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>14-Day Money-Back Guarantee:</strong> For one-time Lifetime Access purchases, we offer a full refund within 14 days of purchase if you are not satisfied with Quizabl, provided you have created fewer than 10 activities. This limit helps prevent abuse while ensuring genuine customers can try the platform risk-free. To request a refund, email support@quizabl.com with your order details. Refunds are processed to your original payment method within 5-7 business days.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>Subscription Refunds:</strong> Monthly or annual subscriptions may be cancelled at any time but are non-refundable for the current billing period.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Cancellation:</strong> You may cancel your subscription at any time. Access to paid features continues until the end of your billing period.
            </p>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">7. Educational Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Quizabl is designed for educational purposes. By using the Service:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Teachers are responsible for obtaining necessary parental consents for students under 13</li>
              <li>Content must be appropriate for the educational context</li>
              <li>Student data must be handled in compliance with applicable education privacy laws (FERPA, COPPA, etc.)</li>
              <li>Schools and districts may have additional policies that apply</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To the maximum extent permitted by law:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Quizabl is provided "as is" without warranties of any kind</li>
              <li>We are not liable for any indirect, incidental, or consequential damages</li>
              <li>Our total liability is limited to the amount you paid in the past 12 months</li>
              <li>We do not guarantee uninterrupted or error-free service</li>
              <li>You are responsible for backing up your content</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">9. Termination</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may terminate or suspend your account and access to the Service:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>For violations of these Terms</li>
              <li>For fraudulent or illegal activity</li>
              <li>For extended periods of inactivity</li>
              <li>At our sole discretion with or without notice</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Upon termination, your right to use the Service ceases immediately. You may export your data before termination.
            </p>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">10. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. Significant changes will be communicated via email or prominent notice. Continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">11. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of [Your Jurisdiction] without regard to conflict of law principles. Any disputes will be resolved in the courts of [Your Jurisdiction].
            </p>
          </section>

          <section>
            <h2 className="font-display italic text-2xl mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms, please contact us at:
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
export default TermsOfService;