import { apiRequest } from "./_helpers";
import type { PricingType, ShopProduct } from "@/types/product.types";
import type { ID } from "@/types/common.types";

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}
interface PageEnvelope<T> {
  content: T[];
  totalElements: number;
}

export interface ProductSeller {
  /** shop-product (inventory) id — used as the cart line reference */
  id: ID;
  shopId: ID;
  shopName?: string;
  shopMobile?: string;
  shopLocation?: string;
  shopLatitude?: number;
  shopLongitude?: number;
  deliveryAvailable: boolean;
  sellingPrice: number;
  mrp?: number;
  availableQuantity: number;
  inStock: boolean;
}

interface BackendShopProduct {
  id: string;
  shopId: string;
  productId: string;
  productName?: string;
  sku?: string;
  sellingPrice?: number;
  costPrice?: number;
  mrp?: number;
  pricingType?: PricingType;
  quantityOnHand?: number;
  availableQuantity?: number;
  lowStockThreshold?: number;
  active?: boolean;
}

function mapShopProduct(s: BackendShopProduct): ShopProduct {
  return {
    id: s.id,
    productId: s.productId,
    shopId: s.shopId,
    sku: s.sku ?? "",
    itemName: s.productName,
    qty: s.quantityOnHand ?? 0,
    lowStockQty: s.lowStockThreshold,
    inputPrice: s.costPrice ?? 0,
    mrpPrice: s.mrp ?? 0,
    sellingPrice: s.sellingPrice ?? 0,
    pricingType: s.pricingType,
    isActive: s.active ?? true,
  };
}

/** Payload to add/update a product in a shop's inventory. */
export interface ShopProductPayload {
  shopId: ID;
  productId: ID;
  sku?: string;
  sellingPrice?: number;
  costPrice?: number;
  mrp?: number;
  pricingType?: PricingType;
  lowStockThreshold?: number;
}

const BASE = "/inventory/shop-products";

export const shopProductsService = {
  /** Shop inventory for a given shop (returns [] when no shop is selected). */
  list: async (shopId?: ID): Promise<ShopProduct[]> => {
    if (!shopId) return [];
    const env = await apiRequest<ApiEnvelope<PageEnvelope<BackendShopProduct> | BackendShopProduct[]>>({
      url: `${BASE}/shop/${shopId}`,
      params: { size: 500 },
    });
    const data = env.data;
    const rows = Array.isArray(data) ? data : data?.content ?? [];
    return rows.map(mapShopProduct);
  },

  get: async (id: ID): Promise<ShopProduct> => {
    const env = await apiRequest<ApiEnvelope<BackendShopProduct>>({ url: `${BASE}/${id}` });
    return mapShopProduct(env.data);
  },

  /** Storefront: shops selling a product, cheapest first (public GET). */
  sellersForProduct: async (productId: ID): Promise<ProductSeller[]> => {
    const env = await apiRequest<ApiEnvelope<ProductSeller[]>>({ url: `${BASE}/product/${productId}` });
    return env.data ?? [];
  },

  create: async (payload: ShopProductPayload): Promise<ShopProduct> => {
    const env = await apiRequest<ApiEnvelope<BackendShopProduct>>({ method: "POST", url: BASE, data: payload });
    return mapShopProduct(env.data);
  },

  update: async (id: ID, payload: Partial<ShopProductPayload>): Promise<ShopProduct> => {
    const env = await apiRequest<ApiEnvelope<BackendShopProduct>>({ method: "PUT", url: `${BASE}/${id}`, data: payload });
    return mapShopProduct(env.data);
  },

  /**
   * Move stock by a delta (backend has no absolute-quantity field; the update
   * endpoint ignores quantity). Positive delta = stock in, negative = stock out.
   */
  adjustStock: (id: ID, delta: number, notes = "Manual edit"): Promise<ShopProduct> => {
    const qty = Math.round(delta);
    const body = qty >= 0 ? { quantityIn: qty } : { quantityOut: -qty };
    return apiRequest<ApiEnvelope<BackendShopProduct>>({
      method: "PATCH",
      url: `${BASE}/${id}/adjust-stock`,
      data: { ...body, notes },
    }).then((env) => mapShopProduct(env.data));
  },

  remove: (id: ID) => apiRequest<ApiEnvelope<void>>({ method: "DELETE", url: `${BASE}/${id}` }),
};
