import type { Route } from './+types/privacy';

export const meta: Route.MetaFunction = () => {
  return [
    { title: 'Privacy | InlinePDF' },
    {
      name: 'description',
      content:
        'InlinePDF is designed to protect your information by processing files directly on your device.',
    },
  ];
};

export default function PrivacyRoute() {
  return (
    <article className="w-full py-8 sm:py-10 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Privacy Policy</h1>

      <p className="lead text-lg mb-8">
        InlinePDF is designed to protect your information by processing files
        directly on your device. We believe privacy is a fundamental right,
        which is why our tools work locally in your browser.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">What data is used</h2>
      <p>
        InlinePDF uses the PDF and image files you explicitly choose to open
        within the application. It does not access other files on your device.
        We do not collect account information, device identifiers, or usage
        analytics.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">How the data is used</h2>
      <p>
        Your selected files are used to perform the specific PDF operations you
        request, such as merging, cropping, organizing, or extracting images.
        This allows the tools to generate the modified output files you need.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">
        How privacy is protected
      </h2>
      <p>
        All processing happens locally on your device. Your files are never
        uploaded to a server, synced, or shared with third parties. Once you
        close the application or refresh the page, the loaded file data is
        cleared from the browser's memory.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">
        User choice and control
      </h2>
      <p>
        You have complete control over your files. You choose which files to
        process, and the processing only occurs when you initiate an action. You
        can stop using the tools at any time simply by closing the browser tab.
      </p>
    </article>
  );
}
