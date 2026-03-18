import type { Route } from './+types/privacy';

export const meta: Route.MetaFunction = () => {
  return [
    { title: 'Privacy Policy - InlinePDF' },
    {
      name: 'description',
      content:
        'Privacy Policy for InlinePDF - Learn how InlinePDF handles your data.',
    },
  ];
};

export default function PrivacyRoute() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-12 sm:px-12">
      <div className="mx-auto w-full space-y-10">
        <div className="-mx-4 flex flex-col gap-4 px-4 pt-4 pb-0 sm:-mx-12 sm:px-12">
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">
            Privacy Policy
          </h1>
          <div className="bg-border h-px w-full" />
        </div>

        <div className="mt-6! flex items-center gap-2">
          <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-sm font-medium">
            Last Updated: March 18, 2026
          </span>
        </div>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
            What Is Personal Data at InlinePDF?
          </h2>
          <p className="leading-7 not-first:mt-6">
            We consider &quot;personal data&quot; to be any data that relates to
            an identified or identifiable individual. Due to the nature of
            InlinePDF, we primarily process files that you choose locally, such
            as PDF documents and images, and we do not require account creation
            or personal profiles to use the Service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            Your Privacy Rights at InlinePDF
          </h2>
          <p className="leading-7 not-first:mt-6">
            At InlinePDF, we respect your ability to control your own files and
            your own device. Because InlinePDF does not maintain user accounts
            or store uploaded documents on a remote server, we generally do not
            hold personal data in a form that can later be accessed, corrected,
            transferred, or deleted by request.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            Personal Data InlinePDF Collects from You
          </h2>
          <p className="leading-7 not-first:mt-6">
            When you use InlinePDF, we may process the following limited data:
          </p>
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            <li>
              <strong>Selected Files:</strong> PDF and image files you
              explicitly choose for processing inside the app.
            </li>
            <li>
              <strong>Theme Preference:</strong> A local preference such as
              light, dark, or auto theme, stored on your device for interface
              consistency.
            </li>
            <li>
              <strong>In-Memory Processing State:</strong> Temporary file data
              held in browser memory while a tool is actively running.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            InlinePDF&apos;s Use of Personal Data
          </h2>
          <p className="leading-7 not-first:mt-6">
            We use the data we process for the following purposes:
          </p>
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            <li>
              <strong>Providing the Service:</strong> To merge, crop, organize,
              inspect, convert, or prepare files as requested by you.
            </li>
            <li>
              <strong>Maintaining Preferences:</strong> To remember interface
              preferences such as your selected theme on the same device.
            </li>
            <li>
              <strong>Creating Output Files:</strong> To generate new local
              files based on the actions you choose inside the app.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            InlinePDF&apos;s Sharing of Personal Data
          </h2>
          <p className="leading-7 not-first:mt-6">
            We do not sell your personal data. InlinePDF is designed so file
            processing happens on device, and selected files are not sent to a
            remote application server as part of normal use.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            Protection of Personal Data at InlinePDF
          </h2>
          <p className="leading-7 not-first:mt-6">
            We implement privacy-focused design choices to reduce unnecessary
            data exposure. Importantly:
          </p>
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            <li>
              <strong>On-Device Processing:</strong> File operations are
              performed locally rather than through a remote processing service.
            </li>
            <li>
              <strong>No Account Requirement:</strong> InlinePDF does not ask
              you to create an account before using its core tools.
            </li>
            <li>
              <strong>Temporary Memory Use:</strong> File data used during a
              session is cleared when the page refreshes or the app is closed.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            Cookies and Other Technologies
          </h2>
          <p className="leading-7 not-first:mt-6">
            We use limited client-side technologies for the operation of the
            Service:
          </p>
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            <li>
              <strong>Local Storage:</strong> We may store theme preference data
              locally on your device.
            </li>
            <li>
              <strong>Theme Cookies:</strong> We may write lightweight cookies
              to preserve your selected theme between visits.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            Transfer of Personal Data Between Countries
          </h2>
          <p className="leading-7 not-first:mt-6">
            InlinePDF is structured to minimize remote processing of your files.
            To the extent any hosting, delivery, or repository infrastructure is
            distributed globally, related technical service data may pass
            through systems located in different countries.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            Our Commitment to Your Privacy
          </h2>
          <p className="leading-7 not-first:mt-6">
            InlinePDF is built with a local-first mindset. As an open-source
            project, its implementation can be reviewed publicly, and privacy
            protections are designed into the product experience from the start.
          </p>
        </section>

        <div className="bg-border h-px w-full" />

        <section className="space-y-4">
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            Privacy Questions
          </h3>
          <p className="leading-7 not-first:mt-6">
            If you have any questions about this Privacy Policy or our privacy
            practices, please contact us through the project repository.
          </p>
        </section>
      </div>
    </main>
  );
}
