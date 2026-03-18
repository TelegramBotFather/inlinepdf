import type { Route } from './+types/terms';
import { AppLink } from '~/shared/navigation/app-link';

export const meta: Route.MetaFunction = () => [
  { title: 'Terms of Use - InlinePDF' },
  {
    name: 'description',
    content: 'Terms of Use for InlinePDF services.',
  },
];

export default function TermsRoute() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-12 sm:px-12">
      <div className="mx-auto w-full space-y-10">
        <div className="-mx-4 flex flex-col gap-4 px-4 pt-4 pb-0 sm:-mx-12 sm:px-12">
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">
            Terms of Use
          </h1>
          <div className="bg-border h-px w-full" />
        </div>

        <div className="mt-6! flex items-center gap-2">
          <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-sm font-medium">
            Last Updated: March 18, 2026
          </span>
        </div>

        <p className="text-muted-foreground text-xl">
          THIS LEGAL AGREEMENT BETWEEN YOU AND INLINEPDF GOVERNS YOUR USE OF THE
          INLINEPDF PRODUCT, SOFTWARE, SERVICES, AND WEBSITE (COLLECTIVELY
          REFERRED TO AS THE “SERVICE”). IT IS IMPORTANT THAT YOU READ AND
          UNDERSTAND THE FOLLOWING TERMS.
        </p>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
            I. Acceptance of Terms
          </h2>
          <p className="leading-7 not-first:mt-6">
            By accessing or using the Service, you agree to be bound by these
            Terms of Use (&quot;Terms&quot;). If you do not agree to these
            Terms, please do not use the Service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            II. Description of Service
          </h2>
          <p className="leading-7 not-first:mt-6">
            InlinePDF provides a local-first toolset that allows users to merge,
            crop, organize, inspect, convert, and prepare PDF and image files.
            The Service is designed so that file processing happens on device as
            part of the app experience.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            III. User Responsibilities
          </h2>
          <p className="leading-7 not-first:mt-6">
            You represent and warrant that:
          </p>
          <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">
            <li>
              You have the legal right to access, modify, convert, and process
              the files you select in the Service.
            </li>
            <li>
              You will not use the Service for any illegal or unauthorized
              purpose, including but not limited to copyright infringement,
              document fraud, or misuse of protected content.
            </li>
            <li>
              You will not attempt to interfere with, disrupt, or abuse the
              Service, including through automated misuse, denial-of-service
              behavior, or exploitation of any part of the application.
            </li>
            <li>
              You will not attempt to gain unauthorized access to any portion or
              feature of the Service, or any related systems or networks, by
              hacking, password &quot;mining&quot;, or any other illegitimate
              means.
            </li>
            <li>
              You are responsible for maintaining backups of your important
              files before using the Service.
            </li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            IV. Feedback and Information
          </h2>
          <p className="leading-7 not-first:mt-6">
            Any feedback you provide regarding the Service shall be deemed
            non-confidential. InlinePDF shall be free to use such information on
            an unrestricted basis. By submitting feedback, you grant InlinePDF a
            perpetual, irrevocable, worldwide, royalty-free license to use and
            publish your feedback for any purpose.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            V. Privacy and Data Processing
          </h2>
          <p className="leading-7 not-first:mt-6">
            Your use of the Service is also governed by our{' '}
            <AppLink
              to="/privacy"
              prefetch="intent"
              className="font-medium underline underline-offset-4"
            >
              Privacy Policy
            </AppLink>
            . You understand that by using the Service, you consent to the
            collection and use of information as set forth in the Privacy
            Policy, including local preference storage and temporary in-memory
            file processing as required for the app to function.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            VI. Intellectual Property &amp; Open Source License
          </h2>
          <p className="leading-7 not-first:mt-6">
            The Service&apos;s source code is open source and made available
            under the project&apos;s applicable license. Under that license:
          </p>
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            <li>
              <strong>Freedom to Use:</strong> You may review, use, and work
              with the source code according to the terms of the project
              license.
            </li>
            <li>
              <strong>License Compliance:</strong> If you modify or distribute
              the project, you must comply with the terms of the applicable
              open-source license.
            </li>
            <li>
              <strong>Attribution:</strong> Required license and copyright
              notices must remain with distributed copies where applicable.
            </li>
            <li>
              <strong>No Warranty:</strong> The source code is provided without
              warranty, subject to the terms of the applicable license.
            </li>
          </ul>
          <p className="leading-7 not-first:mt-6">
            The files you process through InlinePDF remain yours or the property
            of their respective rights holders. InlinePDF does not claim
            ownership over your documents, images, or derived outputs.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            VII. Indemnity
          </h2>
          <p className="leading-7 not-first:mt-6">
            You agree to indemnify and hold InlinePDF and its contributors
            harmless from any demands, loss, liability, claims, or expenses
            (including attorneys&apos; fees), made against InlinePDF by any
            third party due to or arising out of or in connection with your use
            of the Service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            VIII. Disclaimer of Warranties
          </h2>
          <p className="leading-7 uppercase not-first:mt-6">
            The Service is provided &quot;AS IS&quot; and &quot;AS
            AVAILABLE&quot; without warranties of any kind, either express or
            implied, including, but not limited to, implied warranties of
            merchantability, fitness for a particular purpose, or
            non-infringement. InlinePDF does not warrant that the Service will
            be uninterrupted, secure, or error-free.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            IX. Limitation of Liability
          </h2>
          <p className="leading-7 uppercase not-first:mt-6">
            To the maximum extent permitted by law, InlinePDF shall not be
            liable for any indirect, incidental, special, consequential, or
            punitive damages, or any loss of profits, revenues, data, or files,
            whether incurred directly or indirectly, arising out of your use of
            the Service or any files processed through it.
          </p>
        </section>
      </div>
    </main>
  );
}
