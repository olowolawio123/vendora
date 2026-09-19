import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ChevronDown,
  ShoppingBag,
  CreditCard,
  UserRound,
  Store,
  ShieldCheck,
  RefreshCcw,
  MessageCircle,
  Mail,
} from "lucide-react";

const categories = [
  {
    title: "Buying on Vendora",
    description: "Learn how to find products, place orders, and track deliveries.",
    icon: ShoppingBag,
  },
  {
    title: "Orders & Payments",
    description: "Get help with checkout, payments, orders, and transaction issues.",
    icon: CreditCard,
  },
  {
    title: "Account & Login",
    description: "Manage your account, password, email verification, and profile.",
    icon: UserRound,
  },
  {
    title: "Selling on Vendora",
    description: "Learn how to become a seller, add products, and manage orders.",
    icon: Store,
  },
  {
    title: "Safety & Security",
    description: "Learn how Vendora helps protect buyers and sellers.",
    icon: ShieldCheck,
  },
  {
    title: "Returns & Refunds",
    description: "Understand returns, refunds, and what to do when something goes wrong.",
    icon: RefreshCcw,
  },
];

const faqs = [
  {
    question: "How do I create a Vendora account?",
    answer:
      "Click Register, enter your details, create a strong password, and verify your email address using the verification code sent to you.",
  },
  {
    question: "How do I buy a product?",
    answer:
      "Browse or search for a product, open its product page, add it to your cart, and continue to checkout to complete your purchase.",
  },
  {
    question: "How do I become a seller?",
    answer:
      "Use the Become a Seller option in your account and complete the seller application. Your application may need to be reviewed before you can start selling.",
  },
  {
    question: "What should I do if I forget my password?",
    answer:
      "Go to the Login page and select Forgot Password. Enter your email address and follow the password reset instructions.",
  },
  {
    question: "How can I contact Vendora support?",
    answer:
      "If you cannot find an answer in the Help Center, use the Contact Support option to get assistance with your issue.",
  },
  {
    question: "How does Vendora help keep users safe?",
    answer:
      "Vendora is designed with account security, seller controls, payment verification, and reporting features to help create a safer marketplace.",
  },
];

const HelpCenter = () => {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const filteredFaqs = faqs.filter((faq) => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return true;
    }

    return (
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gray-900 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-300">
            Vendora Support
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            How can we help?
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-gray-300">
            Find answers to common questions about buying, selling, payments,
            accounts, and staying safe on Vendora.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <div className="flex items-center rounded-xl bg-white px-4 py-3 shadow-lg">
              <Search className="mr-3 h-5 w-5 shrink-0 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for help..."
                className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Browse help topics
            </h2>

            <p className="mt-2 text-gray-600">
              Choose a topic to find information about Vendora.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <button
                  key={category.title}
                  type="button"
                  className="group rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100">
                    <Icon className="h-5 w-5 text-gray-700" />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900">
                    {category.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {category.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Frequently asked questions
            </h2>

            <p className="mt-2 text-gray-600">
              Quick answers to common Vendora questions.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => {
                const isOpen = openFaq === index;

                return (
                  <div
                    key={faq.question}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFaq(isOpen ? null : index)
                      }
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left hover:bg-gray-50"
                    >
                      <span className="font-medium text-gray-900">
                        {faq.question}
                      </span>

                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pr-12 text-sm leading-6 text-gray-600">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-10 text-center">
                <Search className="mx-auto h-8 w-8 text-gray-400" />

                <p className="mt-3 font-medium text-gray-900">
                  No matching help articles found.
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Try searching with a different keyword.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-16">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <MessageCircle className="h-6 w-6 text-gray-700" />
            </div>

            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Still need help?
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-gray-600">
              If you cannot find the answer you need, contact the Vendora
              support team and we'll help you with your issue.
            </p>

            <Link
  to="/contact-support"
  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
>
  <Mail className="h-4 w-4" />
  Contact Support
</Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HelpCenter;