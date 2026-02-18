import { Layout } from "@/components/layout/Layout";

export default function TermsPage() {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-headline mb-6">
          Terms of <span className="text-primary">Service</span>
        </h1>
        
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-headline mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using the Za Ndani website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-headline mb-4">2. Use of Content</h2>
            <p className="text-muted-foreground mb-4">
              All content published on Za Ndani, including but not limited to articles, images, graphics, and videos, is the property of Za Ndani or its content suppliers and is protected by copyright laws.
            </p>
            <p className="text-muted-foreground">
              You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our website without prior written consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-headline mb-4">3. User Conduct</h2>
            <p className="text-muted-foreground mb-4">
              When using our website, you agree not to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the site for any unlawful purpose</li>
              <li>Post or transmit any defamatory, abusive, or obscene material</li>
              <li>Interfere with the proper working of the website</li>
              <li>Attempt to gain unauthorized access to any portion of the website</li>
              <li>Use automated systems or software to extract data from the website</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-headline mb-4">4. Comments and Submissions</h2>
            <p className="text-muted-foreground">
              Any comments, feedback, or submissions you provide to us become our property. We reserve the right to use, reproduce, modify, and distribute such content for any purpose without compensation to you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-headline mb-4">5. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              Za Ndani provides content on an "as is" and "as available" basis. We make no representations or warranties of any kind, express or implied, as to the operation of the website or the information, content, materials, or products included on this website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-headline mb-4">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Za Ndani will not be liable for any damages of any kind arising from the use of this website, including, but not limited to direct, indirect, incidental, punitive, and consequential damages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-headline mb-4">7. Third-Party Links</h2>
            <p className="text-muted-foreground">
              Our website may contain links to third-party websites. These links are provided solely as a convenience to you. We have no control over the content of those sites and accept no responsibility for them or for any loss or damage that may arise from your use of them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-headline mb-4">8. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. We will notify users of any changes by updating the "Last updated" date of these terms. Your continued use of the website after any changes indicates your acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-headline mb-4">9. Contact</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us at{" "}
              <a href="mailto:contact@zandani.co.ke" className="text-primary hover:underline">
                contact@zandani.co.ke
              </a>
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
