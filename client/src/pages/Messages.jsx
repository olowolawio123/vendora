import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import { toast } from "react-toastify";

import {
  getConversations,
  getConversation,
  sendMessage,
} from "../services/messageService";

import { useAuth } from "../context/AuthContext";

function Messages() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] =
    useState(null);

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const [loadingConversations, setLoadingConversations] =
    useState(true);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [sending, setSending] = useState(false);

  const conversationFromUrl = new URLSearchParams(
    location.search
  ).get("conversation");

  const loadConversations = async (
    showLoading = true
  ) => {
    try {
      if (showLoading) {
        setLoadingConversations(true);
      }

      const data = await getConversations();

      const loadedConversations =
        data.conversations || [];

      setConversations(loadedConversations);

      return loadedConversations;
    } catch (error) {
      console.error(
        "Load conversations error:",
        error
      );

      if (showLoading) {
        toast.error(
          error.message ||
            "Unable to load conversations"
        );
      }

      return [];
    } finally {
      if (showLoading) {
        setLoadingConversations(false);
      }
    }
  };

  const loadConversation = async (
    conversationId,
    showLoading = true
  ) => {
    try {
      if (showLoading) {
        setLoadingMessages(true);
      }

      const data = await getConversation(
        conversationId
      );

      setSelectedConversation(
        data.conversation
      );

      setMessages(data.messages || []);
    } catch (error) {
      console.error(
        "Load conversation error:",
        error
      );

      if (showLoading) {
        toast.error(
          error.message ||
            "Unable to load conversation"
        );
      }
    } finally {
      if (showLoading) {
        setLoadingMessages(false);
      }
    }
  };

  useEffect(() => {
    const initializeMessages = async () => {
      const loadedConversations =
        await loadConversations();

      if (conversationFromUrl) {
        const exists =
          loadedConversations.some(
            (conversation) =>
              conversation._id ===
              conversationFromUrl
          );

        if (exists) {
          await loadConversation(
            conversationFromUrl
          );
        } else {
          toast.error(
            "Conversation could not be found."
          );

          navigate("/messages", {
            replace: true,
          });
        }
      }
    };

    initializeMessages();
  }, [conversationFromUrl]);

  useEffect(() => {
    if (!selectedConversation?._id) {
      return;
    }

    const conversationId =
      selectedConversation._id;

    const refreshConversation = async () => {
      try {
        const data = await getConversation(
          conversationId
        );

        setSelectedConversation(
          data.conversation
        );

        setMessages(data.messages || []);

        await loadConversations(false);
      } catch (error) {
        console.error(
          "Automatic message refresh error:",
          error
        );
      }
    };

    const interval = setInterval(
      refreshConversation,
      4000
    );

    return () => {
      clearInterval(interval);
    };
  }, [selectedConversation?._id]);

  const handleSelectConversation = async (
    conversationId
  ) => {
    await loadConversation(conversationId);

    navigate(
      `/messages?conversation=${conversationId}`,
      {
        replace: true,
      }
    );
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const text = messageText.trim();

    if (!text) {
      return;
    }

    if (!selectedConversation?._id) {
      return;
    }

    try {
      setSending(true);

      const data = await sendMessage(
        selectedConversation._id,
        text
      );

      setMessages((previousMessages) => [
        ...previousMessages,
        data.data,
      ]);

      setMessageText("");

      await loadConversations(false);
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      toast.error(
        error.message ||
          "Unable to send message"
      );
    } finally {
      setSending(false);
    }
  };

  const getProductImage = (conversation) => {
    const images =
      conversation?.product?.images;

    if (
      !Array.isArray(images) ||
      images.length === 0
    ) {
      return null;
    }

    const firstImage = images[0];

    if (typeof firstImage === "string") {
      return firstImage;
    }

    if (firstImage?.url) {
      return firstImage.url;
    }

    return null;
  };

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleString();
  };

  const getOtherParticipantName = (
    conversation
  ) => {
    if (user?.role === "buyer") {
      return (
        conversation?.seller?.storeName ||
        "Seller"
      );
    }

    return (
      conversation?.buyer?.name ||
      "Buyer"
    );
  };

  const getUnreadCount = (conversation) => {
    if (user?.role === "buyer") {
      return conversation?.buyerUnreadCount || 0;
    }

    return conversation?.sellerUnreadCount || 0;
  };

  const isMyMessage = (message) => {
    const currentUserId =
      user?._id || user?.id;

    const senderId =
      typeof message?.sender === "object"
        ? message?.sender?._id
        : message?.sender;

    if (!currentUserId || !senderId) {
      return false;
    }

    return (
      senderId.toString() ===
      currentUserId.toString()
    );
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Messages
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Communicate with buyers and sellers
            about products.
          </p>
        </div>

        <div className="grid min-h-[650px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[360px_1fr]">
          <aside className="border-b border-gray-200 lg:border-b-0 lg:border-r">
            <div className="border-b border-gray-200 px-4 py-4">
              <h2 className="font-semibold text-gray-900">
                Conversations
              </h2>
            </div>

            {loadingConversations ? (
              <div className="p-5 text-sm text-gray-500">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-5 text-sm text-gray-500">
                No conversations yet.
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {conversations.map(
                  (conversation) => {
                    const image =
                      getProductImage(
                        conversation
                      );

                    const isSelected =
                      selectedConversation?._id ===
                      conversation._id;

                    const unreadCount =
                      getUnreadCount(
                        conversation
                      );

                    return (
                      <button
                        key={conversation._id}
                        type="button"
                        onClick={() =>
                          handleSelectConversation(
                            conversation._id
                          )
                        }
                        className={`flex w-full gap-3 border-b border-gray-100 px-4 py-4 text-left transition ${
                          isSelected
                            ? "bg-gray-100"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {image ? (
                            <img
                              src={image}
                              alt={
                                conversation
                                  .product?.title ||
                                "Product"
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="truncate text-sm font-semibold text-gray-900">
                              {conversation
                                .product?.title ||
                                "Product"}
                            </h3>

                            {conversation.lastMessageAt && (
                              <span className="shrink-0 text-[11px] text-gray-400">
                                {formatDate(
                                  conversation.lastMessageAt
                                )}
                              </span>
                            )}
                          </div>

                          <p className="mt-1 truncate text-xs text-gray-500">
                            {conversation
                              .lastMessage ||
                              "No messages yet"}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {getOtherParticipantName(
                              conversation
                            )}
                          </p>
                        </div>

                        {unreadCount > 0 && (
                          <span className="mt-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[10px] font-semibold text-white">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </aside>

          <section className="flex min-h-[650px] flex-col">
            {!selectedConversation ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Select a conversation
                  </h2>

                  <p className="mt-2 max-w-sm text-sm text-gray-500">
                    Choose a conversation from the
                    left to view your messages.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-gray-200 px-5 py-4">
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation
                      .product?.title ||
                      "Conversation"}
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {getOtherParticipantName(
                      selectedConversation
                    )}
                  </p>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-5">
                  {loadingMessages ? (
                    <div className="text-sm text-gray-500">
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-sm text-gray-500">
                      No messages yet. Start the
                      conversation.
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMine =
                        isMyMessage(message);

                      return (
                        <div
                          key={message._id}
                          className={`flex ${
                            isMine
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              isMine
                                ? "bg-black text-white"
                                : "bg-white text-gray-900 shadow-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm">
                              {message.text}
                            </p>

                            <p
                              className={`mt-1 text-[10px] ${
                                isMine
                                  ? "text-gray-300"
                                  : "text-gray-400"
                              }`}
                            >
                              {formatDate(
                                message.createdAt
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-gray-200 bg-white p-4"
                >
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(event) =>
                        setMessageText(
                          event.target.value
                        )
                      }
                      maxLength={2000}
                      placeholder="Write a message..."
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                    />

                    <button
                      type="submit"
                      disabled={
                        sending ||
                        !messageText.trim()
                      }
                      className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending
                        ? "Sending..."
                        : "Send"}
                    </button>
                  </div>

                  <div className="mt-2 text-right text-xs text-gray-400">
                    {messageText.length}/2000
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Messages;