import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import apiFetch from "../services/apiFetch";

const getStatusStyles = (status) => {
  switch (status) {
    case "in-progress":
      return {
        label: "In Progress",
        className:
          "bg-blue-50 text-blue-700 ring-blue-200",
      };

    case "resolved":
      return {
        label: "Resolved",
        className:
          "bg-green-50 text-green-700 ring-green-200",
      };

    case "closed":
      return {
        label: "Closed",
        className:
          "bg-gray-100 text-gray-700 ring-gray-200",
      };

    case "open":
    default:
      return {
        label: "Open",
        className:
          "bg-yellow-50 text-yellow-700 ring-yellow-200",
      };
  }
};

const MySupportRequests = () => {
  const [supportRequests, setSupportRequests] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSupportRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(
        "/api/support/my-requests"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load your support requests"
        );
      }

      setSupportRequests(
        data.supportRequests || []
      );
    } catch (error) {
      setError(
        error.message ||
          "Unable to load your support requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupportRequests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/help-center"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Help Center
          </Link>

          <button
            type="button"
            onClick={loadSupportRequests}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <MessageSquare className="h-6 w-6 text-gray-700" />
            </div>

            <h1 className="mt-5 text-3xl font-bold text-gray-900">
              My Support Requests
            </h1>

            <p className="mt-2 text-gray-600">
              View your support requests and track
              their current status.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Loading your support requests...
              </div>
            </div>
          ) : error ? (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={loadSupportRequests}
                className="mt-4 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Try Again
              </button>
            </div>
          ) : supportRequests.length === 0 ? (
            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <MessageSquare className="h-6 w-6 text-gray-500" />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                No support requests yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
                You have not submitted any support
                requests yet. If you need help, you
                can contact the Vendora support team.
              </p>

              <Link
                to="/contact-support"
                className="mt-5 inline-flex items-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Contact Support
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-5">
              {supportRequests.map((request) => {
                const status = getStatusStyles(
                  request.status
                );

                return (
                  <div
                    key={request._id}
                    className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="break-words text-lg font-semibold text-gray-900">
                          {request.subject}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                          {request.category}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-5 rounded-lg bg-gray-50 p-4">
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                        {request.message}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-4 w-4" />

                      <span>
                        Submitted{" "}
                        {new Date(
                          request.createdAt
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading &&
            !error &&
            supportRequests.length > 0 && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <Link
                  to="/contact-support"
                  className="inline-flex items-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Contact Support
                </Link>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MySupportRequests;