import type { Route } from './+types/terms';

export const meta: Route.MetaFunction = () => {
  return [
    { title: 'Terms of Service | InlinePDF' },
    {
      name: 'description',
      content: 'Terms of Service for using InlinePDF local-first tools.',
    },
  ];
};

export default function TermsRoute() {
  return (
    <article className="w-full py-8 sm:py-10 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        Terms of Service
      </h1>

      <p className="lead text-lg mb-8">
        InlinePDF provides local-first PDF tools designed to operate directly
        within your browser. By using these tools, you agree to these Terms of
        Service.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">Service Description</h2>
      <p>
        InlinePDF offers utilities for modifying and extracting information from
        PDF and image files. Because the service operates entirely on your
        device without server-side processing, you are entirely responsible for
        the files you choose to process.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">Open Source License</h2>
      <p>
        The source code for InlinePDF is made available under an open-source
        license. You may view, inspect, and use the source code in accordance
        with the terms specified in the project's license file.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">
        Disclaimer of Warranties
      </h2>
      <p>
        InlinePDF is provided "as is" and "as available" without warranties of
        any kind. We do not guarantee that the tools will meet your specific
        requirements, operate without interruption, or be completely error-free.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">
        Limitation of Liability
      </h2>
      <p>
        Because files are processed locally on your device, we do not store
        backups or copies of your data. We are not liable for any data loss,
        file corruption, or other damages arising from your use of the tools.
        Always ensure you have backups of important files before processing
        them.
      </p>
    </article>
  );
}
