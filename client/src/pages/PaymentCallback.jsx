import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  LoaderCircle,
  XCircle,
} from "lucide-react";
import apiFetch from "../services/apiFetch";

const API_URL = import.meta.env.VITE_API_URL;

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState(
    "Verifying your payment..."
  );
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference =
          searchParams.get("reference");

        if (!reference) {
          setStatus("failed");
          setMessage(
            "No payment reference was returned by Paystack."
          );
          return;
        }

        /*
          The order ID is stored in Paystack metadata,
          but Paystack's redirect gives us the reference.

          We therefore first retrieve the order associated
          with this reference through our backend.
        */
       const response = await apiFetch(
  `/api/orders/verify-reference/${encodeURIComponent(reference)}`
);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to find the payment order"
          );
        }

        const orderId = data.orderId;

        const verifyResponse = await apiFetch(
  `/api/orders/${orderId}/verify-payment`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reference,
    }),
  }
);

        const verifyData =
          await verifyResponse.json();

        if (!verifyResponse.ok) {
          throw new Error(
            verifyData.message ||
              "Payment verification failed"
          );
        }

        setOrder(verifyData.order);
        setStatus("success");
        setMessage(
          "Your payment was verified successfully."
        );
      } catch (error) {
        setStatus("failed");
        setMessage(error.message);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (status === "verifying") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <LoaderCircle
            size={46}
            className="mx-auto animate-spin text-gray-800"
          />

          <h1 className="mt-5 text-xl font-bold text-gray-950">
            Verifying payment
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Please wait while we confirm your
            transaction with Paystack.
          </p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <XCircle
            size={50}
            className="mx-auto text-red-500"
          />

          <h1 className="mt-5 text-2xl font-bold text-gray-950">
            Payment verification failed
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            {message}
          </p>

          <Link
            to="/cart"
            className="mt-7 inline-flex rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Return to Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle
          size={54}
          className="mx-auto text-green-600"
        />

        <h1 className="mt-5 text-2xl font-bold text-gray-950">
          Payment successful
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          {message}
        </p>

        {order && (
          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-gray-500">
                Order number
              </span>

              <span className="font-semibold text-gray-900">
                {order.orderNumber}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4 text-sm">
              <span className="text-gray-500">
                Amount paid
              </span>

              <span className="font-semibold text-gray-900">
                ₦{order.total?.toLocaleString()}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4 text-sm">
              <span className="text-gray-500">
                Order status
              </span>

              <span className="font-semibold capitalize text-green-600">
                {order.orderStatus}
              </span>
            </div>
          </div>
        )}

        <Link
          to="/account"
          className="mt-7 inline-flex rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Go to My Account
        </Link>
      </div>
    </div>
  );
};

export default PaymentCallback;