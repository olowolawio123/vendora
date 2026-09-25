const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Vendora <support@vendora-market.com.ng>";

const sendTestEmail = async (to) => {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: "Vendora Email Test",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Vendora Email Test</h2>
        <p>This is a test email from your Vendora marketplace.</p>
        <p>If you received this message, your Resend integration is working.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend test email error:", error);
    throw new Error(error.message || "Failed to send test email");
  }

  return data;
};

const sendVerificationCodeEmail = async (to, code) => {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: "Verify your Vendora email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #111827;">
        <h2>Welcome to Vendora</h2>

        <p>Thank you for creating your Vendora account.</p>

        <p>Use the verification code below to verify your email address:</p>

        <div style="
          margin: 25px 0;
          padding: 18px;
          background: #f3f4f6;
          border-radius: 8px;
          text-align: center;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
        ">
          ${code}
        </div>

        <p>This code expires in <strong>10 minutes</strong>.</p>

        <p>If you did not create a Vendora account, you can safely ignore this email.</p>

        <p style="margin-top: 30px;">
          Vendora<br>
          Buy. Sell. Connect.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Verification email error:", error);
    throw new Error(error.message || "Failed to send verification email");
  }

  return data;
};

const sendPasswordResetCodeEmail = async (to, code) => {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: "Your Vendora password reset code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #111827;">
        <h2>Reset your Vendora password</h2>

        <p>We received a request to reset your Vendora password.</p>

        <p>Use the code below to continue:</p>

        <div style="
          margin: 25px 0;
          padding: 18px;
          background: #f3f4f6;
          border-radius: 8px;
          text-align: center;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
        ">
          ${code}
        </div>

        <p>This code expires in <strong>10 minutes</strong>.</p>

        <p>If you did not request a password reset, you can safely ignore this email.</p>

        <p style="margin-top: 30px;">
          Vendora<br>
          Buy. Sell. Connect.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Password reset email error:", error);
    throw new Error(
      error.message || "Failed to send password reset email"
    );
  }

  return data;
};


const sendLoginVerificationCodeEmail = async (to, code) => {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: "Your Vendora login verification code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #111827;">
        <h2>Verify your Vendora login</h2>

        <p>
          We detected a login to your Vendora account from a
          device that needs verification.
        </p>

        <p>
          Use the verification code below to continue:
        </p>

        <div style="
          margin: 25px 0;
          padding: 18px;
          background: #f3f4f6;
          border-radius: 8px;
          text-align: center;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
        ">
          ${code}
        </div>

        <p>
          This code expires in <strong>10 minutes</strong>.
        </p>

        <p>
          If you did not attempt to log in to your Vendora account,
          please change your password and contact Vendora support.
        </p>

        <p style="margin-top: 30px;">
          Vendora<br>
          Buy. Sell. Connect.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error(
      "Login verification email error:",
      error
    );

    throw new Error(
      error.message ||
        "Failed to send login verification email"
    );
  }

  return data;
};

const sendSupportRequestEmail = async (supportRequest) => {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: ["olowolawio@gmail.com"],
    subject: `New Vendora Support Request: ${supportRequest.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 30px; color: #111827;">
        <h2 style="margin-bottom: 20px;">
          New Vendora Support Request
        </h2>

        <p>
          A new support request has been submitted through the Vendora Help Center.
        </p>

        <div style="margin-top: 25px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
          <p>
            <strong>Name:</strong>
            ${supportRequest.name}
          </p>

          <p>
            <strong>Email:</strong>
            ${supportRequest.email}
          </p>

          <p>
            <strong>Category:</strong>
            ${supportRequest.category}
          </p>

          <p>
            <strong>Subject:</strong>
            ${supportRequest.subject}
          </p>

          <p>
            <strong>Message:</strong>
          </p>

          <div style="padding: 15px; background: #ffffff; border-radius: 6px; white-space: pre-wrap;">
            ${supportRequest.message}
          </div>
        </div>

        <p style="margin-top: 30px; color: #6b7280;">
          Vendora<br>
          Buy. Sell. Connect.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error(
      "Support request email error:",
      error
    );

    throw new Error(
      error.message ||
        "Failed to send support request email"
    );
  }

  return data;
};

module.exports = {
  sendTestEmail,
  sendVerificationCodeEmail,
  sendPasswordResetCodeEmail,
  sendLoginVerificationCodeEmail,
  sendSupportRequestEmail,
};