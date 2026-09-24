import apiFetch from "./apiFetch";

export const createConversation = async (
  productId,
  sellerId
) => {
  const response = await apiFetch(
    "/api/messages/conversations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        sellerId,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to create conversation"
    );
  }

  return data;
};

export const getConversations = async () => {
  const response = await apiFetch(
    "/api/messages/conversations"
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to load conversations"
    );
  }

  return data;
};

export const getConversation = async (
  conversationId
) => {
  const response = await apiFetch(
    `/api/messages/conversations/${conversationId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to load conversation"
    );
  }

  return data;
};

export const sendMessage = async (
  conversationId,
  text
) => {
  const response = await apiFetch(
    `/api/messages/conversations/${conversationId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to send message"
    );
  }

  return data;
};

export const markConversationAsRead = async (
  conversationId
) => {
  const response = await apiFetch(
    `/api/messages/conversations/${conversationId}/read`,
    {
      method: "PATCH",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to mark conversation as read"
    );
  }

  return data;
};