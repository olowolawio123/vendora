import apiFetch from "./apiFetch";

// =====================================================
// GET ALL COUPONS
// =====================================================
export const getAdminCoupons = async () => {
  const response = await apiFetch(
    "/api/admin/coupons"
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to load coupons"
    );
  }

  return data;
};

// =====================================================
// CREATE COUPON
// =====================================================
export const createAdminCoupon = async (
  couponData
) => {
  const response = await apiFetch(
    "/api/admin/coupons",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(couponData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to create coupon"
    );
  }

  return data;
};

// =====================================================
// UPDATE COUPON
// =====================================================
export const updateAdminCoupon = async (
  couponId,
  couponData
) => {
  const response = await apiFetch(
    `/api/admin/coupons/${couponId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(couponData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to update coupon"
    );
  }

  return data;
};

// =====================================================
// TOGGLE COUPON
// =====================================================
export const toggleAdminCoupon = async (
  couponId
) => {
  const response = await apiFetch(
    `/api/admin/coupons/${couponId}/toggle`,
    {
      method: "PATCH",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to change coupon status"
    );
  }

  return data;
};

// =====================================================
// DELETE COUPON
// =====================================================
export const deleteAdminCoupon = async (
  couponId
) => {
  const response = await apiFetch(
    `/api/admin/coupons/${couponId}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to delete coupon"
    );
  }

  return data;
};