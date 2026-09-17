import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ImagePlus,
  LoaderCircle,
  Package,
  Trash2,
  Upload,
} from "lucide-react";
import apiFetch from "../services/apiFetch";

const API_URL = import.meta.env.VITE_API_URL;

const AddProduct = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    status: "draft",
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []);

    setError("");
    setMessage("");

    if (files.length === 0) {
      return;
    }

    const validFiles = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not a valid image file.`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is larger than 5 MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      event.target.value = "";
      return;
    }

    setSelectedImages((previous) => [
      ...previous,
      ...validFiles,
    ]);

    event.target.value = "";
  };

  const removeImage = (indexToRemove) => {
    setSelectedImages((previous) =>
      previous.filter((_, index) => index !== indexToRemove)
    );
  };

  const uploadImages = async () => {
    const uploadedUrls = [];

    setUploadingImages(true);

    try {
      for (const file of selectedImages) {
        const imageFormData = new FormData();

        imageFormData.append("image", file);

       const response = await apiFetch("/api/products/upload-image", {
  method: "POST",
  body: imageFormData,
});

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || `Unable to upload ${file.name}`
          );
        }

        uploadedUrls.push(data.imageUrl);
      }

      return uploadedUrls;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (selectedImages.length === 0) {
      setError("Please add at least one product image.");
      return;
    }

    setLoading(true);

    try {
      const imageUrls = await uploadImages();

      const response = await apiFetch("/api/products", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: Number(formData.price),
          category: formData.category,
          stock: Number(formData.stock),
          status: formData.status,
          images: imageUrls,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to create product"
        );
      }

      setMessage("Product created successfully.");

      setFormData({
        title: "",
        description: "",
        price: "",
        category: "",
        stock: "",
        status: "draft",
      });

      setSelectedImages([]);

      setTimeout(() => {
        navigate("/seller/products");
      }, 1000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading || uploadingImages;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/seller/products")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-950"
        >
          <ArrowLeft size={17} />
          Back to Products
        </button>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Seller Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            Add Product
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Add your product information, images, pricing and stock
            details to your Vendora store.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-950">
                    Product Images
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Add clear images that show buyers what you're
                    selling.
                  </p>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition hover:border-gray-400 hover:bg-gray-100"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                    <ImagePlus
                      size={26}
                      className="text-gray-600"
                    />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-gray-900">
                    Add product images
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    JPG, PNG, WEBP or other image formats up to 5 MB
                    each
                  </p>

                  <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white">
                    <Upload size={16} />
                    Choose Images
                  </span>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                {selectedImages.length > 0 && (
                  <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        Selected Images
                      </p>

                      <p className="text-xs text-gray-500">
                        {selectedImages.length}{" "}
                        {selectedImages.length === 1
                          ? "image"
                          : "images"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {selectedImages.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Product preview ${index + 1}`}
                            className="aspect-square w-full object-cover"
                          />

                          {index === 0 && (
                            <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-gray-800 shadow-sm">
                              Main image
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            disabled={isSubmitting}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-950/90 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Remove image ${index + 1}`}
                          >
                            <Trash2 size={15} />
                          </button>

                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6">
                            <p className="truncate text-[10px] text-white">
                              {file.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-950">
                    Product Information
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Give buyers clear and useful information about
                    your product.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="title"
                      className="mb-2 block text-sm font-semibold text-gray-900"
                    >
                      Product name
                    </label>

                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Nike Air Max Sneakers"
                      required
                      disabled={isSubmitting}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="mb-2 block text-sm font-semibold text-gray-900"
                    >
                      Description
                    </label>

                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe the product, its condition, features and anything buyers should know."
                      rows={6}
                      required
                      disabled={isSubmitting}
                      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <Package size={20} className="text-gray-700" />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-gray-950">
                      Pricing & Stock
                    </h2>
                    <p className="text-xs text-gray-500">
                      Manage availability
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="price"
                      className="mb-2 block text-sm font-semibold text-gray-900"
                    >
                      Price
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                        ₦
                      </span>

                      <input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                        required
                        disabled={isSubmitting}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="stock"
                      className="mb-2 block text-sm font-semibold text-gray-900"
                    >
                      Stock quantity
                    </label>

                    <input
                      id="stock"
                      name="stock"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.stock}
                      onChange={handleChange}
                      placeholder="e.g. 10"
                      required
                      disabled={isSubmitting}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-bold text-gray-950">
                  Category & Status
                </h2>

                <div className="mt-5 space-y-5">
                  <div>
                    <label
                      htmlFor="category"
                      className="mb-2 block text-sm font-semibold text-gray-900"
                    >
                      Category
                    </label>

                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
                    >
                      <option value="">Select category</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Phones">Phones</option>
                      <option value="Computers">Computers</option>
                      <option value="Home">Home</option>
                      <option value="Beauty">Beauty</option>
                      <option value="Accessories">
                        Accessories
                      </option>
                      <option value="Shoes">Shoes</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="status"
                      className="mb-2 block text-sm font-semibold text-gray-900"
                    >
                      Product status
                    </label>

                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </section>

              <div className="rounded-2xl border border-gray-200 bg-gray-950 p-5 text-white">
                <h3 className="text-sm font-semibold">
                  Product publishing
                </h3>

                <p className="mt-2 text-xs leading-5 text-gray-300">
                  Draft products remain hidden from buyers. Choose
                  Active when you're ready to publish the product.
                </p>
              </div>
            </div>
          </div>

          {(error || message) && (
            <div
              className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
                error
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {error || message}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/seller/products")}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />

                  {uploadingImages
                    ? "Uploading images..."
                    : "Creating product..."}
                </>
              ) : (
                <>
                  <Package size={17} />
                  Create Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default AddProduct;