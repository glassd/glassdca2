import type { Route } from "./+types/contact.sent";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Message sent" },
    {
      name: "description",
      content: "Your message has been sent successfully.",
    },
  ];
}

export default function ContactSent() {
  return (
    <div className="container mx-auto px-4 py-30 max-w-2xl">
      <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M20 7L9 18l-5-5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Message sent
            </h1>
            <p className="mt-2 text-gray-700 dark:text-gray-200">
              Thanks for reaching out. Your message was delivered, and I’ll get
              back to you as soon as I can.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          Back to home
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Send another message
        </Link>
        <Link
          to="/blog"
          className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          View the blog
        </Link>
      </div>
    </div>
  );
}
