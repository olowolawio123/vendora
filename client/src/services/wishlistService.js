import apiFetch from "./apiFetch";

export const getWishlist = async () => {
  const response = await apiFetch("/api/wishlist");

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load wishlist");
  }

  return data;
};

export const addToWishlist = async (productId) => {
  const response = await apiFetch(`/api/wishlist/${productId}`, {
    method: "POST",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to add product to wishlist");
  }

  return data;
};

export const removeFromWishlist = async (productId) => {
  const response = await apiFetch(`/api/wishlist/${productId}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to remove product from wishlist");
  }

  return data;
};

export const checkWishlist = async (productId) => {
  const response = await apiFetch(`/api/wishlist/check/${productId}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to check wishlist");
  }

  return data;
};