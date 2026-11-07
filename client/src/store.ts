import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

export type Garment = {
  id: string;
  name: string;
  category: string;
  color: string;
  season: string;
  style: string;
  era: string;
  imageKey: string;
  isAvailable: boolean;
  isFavorite: boolean;
};
export type Preferences = {
  season: string;
  style: string;
  era: string;
  palette: string;
  trendId: string | null;
};
export type Outfit = {
  id: string;
  name: string;
  season: string;
  style: string;
  palette: string;
  shareToken: string | null;
  items: Garment[];
  createdAtUtc: string;
};
export type Suggestion = { items: Garment[]; score: number; reasons: string[] };
export type Listing = {
  id: string;
  sellerName: string;
  title: string;
  description: string;
  category: string;
  imageKey: string;
  size: string;
  condition: string;
  mode: string;
  priceCents: number;
  city: string;
  available: boolean;
  isMine: boolean;
};
export type Order = {
  id: string;
  listing: Listing;
  buyerName: string;
  note: string;
  status: string;
  totalCents: number;
  isSeller: boolean;
  createdAtUtc: string;
};
export type User = {
  id: string;
  email: string;
  displayName: string;
  city: string;
  hasPassword: boolean;
};
export type Config = {
  demoMode: boolean;
  providers: string[];
  categories: string[];
  seasons: string[];
  styles: string[];
  eras: string[];
  palettes: string[];
  colors: Record<string, string>;
  images: string[];
  trends: {
    id: string;
    title: string;
    description: string;
    style: string;
    colors: string[];
  }[];
};
export type Filters = {
  search: string;
  category: string;
  color: string;
  season: string;
  style: string;
  era: string;
  sort: string;
  favorites: boolean;
};
export const defaultFilters: Filters = {
  search: "",
  category: "",
  color: "",
  season: "",
  style: "",
  era: "",
  sort: "newest",
  favorites: false,
};
const rawQuery = fetchBaseQuery({
  baseUrl: "/api/",
  credentials: "same-origin",
});
const secureQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extra) => {
  const request: FetchArgs = typeof args === "string" ? { url: args } : args;
  if (
    request.method &&
    !["GET", "HEAD"].includes(request.method.toUpperCase())
  ) {
    // Fetch after any sign-in change; tokens are bound to the current authenticated identity.
    const csrf = await rawQuery("csrf", api, extra);
    if (csrf.error) return { error: csrf.error };
    const headers = new Headers(request.headers as HeadersInit | undefined);
    headers.set("X-CSRF-TOKEN", (csrf.data as { token: string }).token);
    return rawQuery({ ...request, headers }, api, extra);
  }
  return rawQuery(request, api, extra);
};
export const api = createApi({
  reducerPath: "api",
  baseQuery: secureQuery,
  tagTypes: ["Data", "Session"],
  endpoints: (b) => ({
    config: b.query<Config, void>({ query: () => "config" }),
    me: b.query<{ user: User | null }, void>({
      query: () => "auth/me",
      providesTags: ["Session"],
    }),
    garments: b.query<Garment[], Filters>({
      query: (f) => ({
        url: "garments",
        params: Object.fromEntries(
          Object.entries(f).filter(([, v]) => v !== "" && v !== false),
        ),
      }),
      providesTags: ["Data"],
    }),
    outfits: b.query<Outfit[], void>({
      query: () => "outfits",
      providesTags: ["Data"],
    }),
    market: b.query<Listing[], void>({
      query: () => "market",
      providesTags: ["Data"],
    }),
    orders: b.query<Order[], void>({
      query: () => "market/orders",
      providesTags: ["Data"],
    }),
    shared: b.query<Outfit, string>({
      query: (token) => `outfits/shared/${encodeURIComponent(token)}`,
      providesTags: ["Data"],
    }),
    command: b.mutation<any, FetchArgs>({
      query: (args) => args,
      invalidatesTags: ["Data", "Session"],
    }),
  }),
});
const ui = createSlice({
  name: "ui",
  initialState: {
    view: "wardrobe",
    filters: defaultFilters,
    preferences: {
      season: "All",
      style: "Any",
      era: "Any",
      palette: "Any",
      trendId: null,
    } as Preferences,
    toast: "",
  },
  reducers: {
    navigate: (s, a: PayloadAction<string>) => {
      s.view = a.payload;
    },
    filter: (s, a: PayloadAction<Partial<Filters>>) => {
      Object.assign(s.filters, a.payload);
    },
    resetFilters: (s) => {
      s.filters = { ...defaultFilters };
    },
    preferences: (s, a: PayloadAction<Partial<Preferences>>) => {
      Object.assign(s.preferences, a.payload);
    },
    toast: (s, a: PayloadAction<string>) => {
      s.toast = a.payload;
    },
  },
});
export const actions = ui.actions;
export const store = configureStore({
  reducer: { ui: ui.reducer, [api.reducerPath]: api.reducer },
  middleware: (g) => g().concat(api.middleware),
});
export type RootState = ReturnType<typeof store.getState>;
export const useAppDispatch = () => useDispatch<typeof store.dispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const {
  useConfigQuery,
  useMeQuery,
  useGarmentsQuery,
  useOutfitsQuery,
  useMarketQuery,
  useOrdersQuery,
  useSharedQuery,
  useCommandMutation,
} = api;
export function errorText(e: unknown): string {
  const x = e as {
    data?: { title?: string; errors?: Record<string, string[]> };
    status?: number;
  };
  return (
    x?.data?.title ||
    (x?.data?.errors
      ? Object.values(x.data.errors).flat().join(" ")
      : x?.status === 401
        ? "Please sign in to continue."
        : "We could not complete that request. Please try again.")
  );
}
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(cents / 100);
