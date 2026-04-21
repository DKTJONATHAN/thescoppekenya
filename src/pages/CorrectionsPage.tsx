import { Layout } from "@/components/layout/Layout";
import { RefreshCcw, Mail, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function CorrectionsPage() {
  return (
    <Layout>
      <Helmet>
        <title>Corrections Policy | Za Ndani</title>
        <meta name="description" content="Our commitment to accuracy and the process for reporting errors on Za Ndani." />
      </Helmet>
      
      <div className="container max-w-4xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-8">Corrections Policy</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="lead text-xl text-muted-foreground mb-12">
            Accuracy is at the heart of our journalism. When we make a mistake, we admit it, 
            fix it, and ensure our readers are informed of the change.
          </p>

          <div className="flex flex-col md:flex-row gap-8 my-16">
            <div className="flex-1 p-8 border border-divider rounded-2xl bg-surface">
              <RefreshCcw className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-4">Our Process</h3>
              <ul className="space-y-3 list-none p-0 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
                  <span>Verify the reported error immediately.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
                  <span>Update the article with the correct information.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
                  <span>Add a clear "Correction" note at the top or bottom of the page.</span>
                </li>
              </ul>
            </div>
            
            <div className="flex-1 p-8 border border-primary/20 rounded-2xl bg-primary/5">
              <Mail className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-4">Report an Error</h3>
              <p className="text-sm mb-4">
                If you believe we have published something incorrect, please let us know immediately.
              </p>
              <div className="space-y-2 font-bold text-headline">
                <p>Email: contact@zandani.co.ke</p>
                <p>WhatsApp: 0706396305</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-6 text-headline">1. Types of Corrections</h2>
          <p>
            <strong>Substantive Corrections:</strong> If we change the core facts or meaning of a story, 
            we will add an update note explaining what was changed and why.
          </p>
          <p>
            <strong>Minor Typos:</strong> Small spelling or grammar errors that do not change the 
            story's meaning may be fixed without a technical correction note.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-6 text-headline">2. Retractions</h2>
          <p>
            In the rare event that a story is found to be fundamentally flawed or ethically 
            uncompromised beyond repair, we will issue a full retraction and explain the 
            circumstances to our audience.
          </p>

          <div className="mt-16 p-6 border-l-4 border-amber-500 bg-amber-500/5 italic">
            <p className="flex items-center gap-2 font-bold mb-2">
              <AlertTriangle className="w-5 h-5" /> Factual Fairness
            </p>
            "We value the feedback of our readers and the subjects of our stories. 
            If you are mentioned in a story and feel it is inaccurate, you have a 
            guaranteed right to request a review."
          </div>
        </div>
      </div>
    </Layout>
  );
}
