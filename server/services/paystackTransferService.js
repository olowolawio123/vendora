const PAYSTACK_BASE_URL =
  "https://api.paystack.co";

const createTransfer = async ({
  amount,
  recipientCode,
  reference,
  reason = "Vendora seller withdrawal",
}) => {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not configured"
    );
  }

  if (!amount || amount <= 0) {
    throw new Error(
      "Transfer amount must be greater than zero"
    );
  }

  if (!recipientCode) {
    throw new Error(
      "Paystack recipient code is required"
    );
  }

  if (!reference) {
    throw new Error(
      "Transfer reference is required"
    );
  }

  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transfer`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          source: "balance",
          amount: Math.round(amount * 100),
          recipient: recipientCode,
          reference,
          reason,
          currency: "NGN",
        }),
      }
    );

    /*
      Read the response safely.

      Paystack normally returns JSON, but if the
      request fails at the network level or the
      response is not valid JSON, we don't want
      the real error to disappear behind
      "fetch failed".
    */
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

    /*
      Paystack returned an HTTP/API error.
    */
    if (!response.ok || !data?.status) {
      console.error(
        "Paystack transfer response:",
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
          `Paystack transfer failed with HTTP ${response.status}`
      );
    }

    return {
      success: true,

      data: data.data,

      message:
        data.message ||
        "Transfer initiated successfully",
    };
  } catch (error) {
    console.error(
      "Paystack transfer network/error details:",
      {
        name: error.name,
        message: error.message,
        cause: error.cause,
        code: error.code,
        stack: error.stack,
      }
    );

    /*
      Preserve the real error message so the
      withdrawal route can record exactly why
      the transfer failed.
    */
    throw new Error(
      error.message ||
        "Paystack transfer request failed"
    );
  }
};

module.exports = {
  createTransfer,
};