// Campus (Food Court, Medical, Feedback, House) -- the same backend the mobile
// Campus tab uses (campus.controller.ts). Every list is "my own requests",
// scoped server-side, so no client-side filtering is needed. Server-only
// apiFetch convention, same as faculty-api.ts.

import { apiFetch } from "./api";
import { parseApiResponse } from "./api-response";

interface ApiEnvelope<T> {
  data: T;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  const body = await parseApiResponse<ApiEnvelope<T>>(res);
  return body.data;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

export interface House {
  id: string;
  name: string;
  colourHex: string | null;
  status: string;
}
export const listHouses = () => request<House[]>("/campus/houses");

export interface FoodOrder {
  id: string;
  items: string;
  pickupTime: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}
export const listFoodOrders = () => request<FoodOrder[]>("/campus/food-orders");
export const createFoodOrder = (input: { items: string; pickupTime?: string; notes?: string }) =>
  post<FoodOrder>("/campus/food-orders", input);

export interface MedicalAppointment {
  id: string;
  preferredDate: string;
  preferredTime: string | null;
  reason: string;
  status: string;
  createdAt: string;
}
export const listMedicalAppointments = () => request<MedicalAppointment[]>("/campus/medical-appointments");
export const createMedicalAppointment = (input: { preferredDate: string; preferredTime?: string; reason: string }) =>
  post<MedicalAppointment>("/campus/medical-appointments", input);

export type FeedbackCategory = "FACILITIES" | "FOOD" | "TRANSPORT" | "SAFETY" | "OTHER";
export interface Feedback {
  id: string;
  category: FeedbackCategory;
  message: string;
  createdAt: string;
}
export const listFeedback = () => request<Feedback[]>("/campus/feedback");
export const createFeedback = (input: { category: FeedbackCategory; message: string }) =>
  post<Feedback>("/campus/feedback", input);
