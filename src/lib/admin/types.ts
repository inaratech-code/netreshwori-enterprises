/** Firestore document types for Netreshwori Admin */

export interface Brand {
  id: string;
  name: string;
  logo: string;
  description: string;
  status: "active" | "inactive";
  createdAt?: number | string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  order?: number;
  createdAt?: number | string;
}

export interface Product {
  id: string;
  productCode: string;
  name: string;
  brandId: string;
  categoryId: string;
  size: string;
  finish: string;
  price?: number;
  stock?: number;
  description: string;
  images: string[];
  featured: boolean;
  status: "active" | "inactive";
  views?: number;
  createdAt?: number | string;
}

export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  productId?: string;
  message: string;
  status: "new" | "contacted";
  createdAt?: number | string;
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  message: string;
  photo?: string;
  approved: boolean;
  createdAt?: number | string;
}

export interface AnalyticsEvent {
  id: string;
  type: "page_view" | "product_view";
  page?: string;
  productId?: string;
  date: string;
  hour: number;
  timestamp: number | string;
}

export interface Settings {
  businessName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  heroTitle: string;
  heroSubtitle: string;
  googleMapLink?: string;
  facebook?: string;
  instagram?: string;
}

export interface MediaItem {
  id: string;
  url: string;
  path: string;
  name: string;
  createdAt: number | string;
}
