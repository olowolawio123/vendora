const PAYSTACK_BASE_URL =
  "https://api.paystack.co";

const refundTransaction = async ({
  transactionReference,
  amount,
}) => {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not configured"
    );
  }

  if (!transactionReference) {
    throw new Error(
      "Paystack transaction reference is required"
    );
  }

  if (!amount || amount <= 0) {
    throw new Error(
      "Refund amount must be greater than zero"
    );
  }

  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/refund`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction:
            transactionReference,
          amount: Math.round(amount * 100),
        }),
      }
    );

    const responseText =
      await response.text();

    let data = null;

    try {
      data = responseText
        ? JSON.parse(responseText)
        : null;
    } catch (parseError) {
      data = null;
    }

    if (!response.ok || !data?.status) {
      console.error(
        "Paystack refund response:",
        {
          httpStatus: response.status,
          httpStatusText:
            response.statusText,
          data,
          responseText,
        }
      );

      throw new Error(
        data?.message ||
          responseText ||
          `Paystack refund failed with HTTP ${response.status}`
      );
    }

    return {
      success: true,
      data: data.data,
      message:
        data.message ||
        "Refund initiated successfully",
    };
  } catch (error) {
    console.error(
      "Paystack refund network/error details:",
      {
        name: error.name,
        message: error.message,
        cause: error.cause,
        code: error.code,
        stack: error.stack,
      }
    );

    throw new Error(
      error.message ||
        "Paystack refund request failed"
    );
  }
};

module.exports = {
  refundTransaction,
};