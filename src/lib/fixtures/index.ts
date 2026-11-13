/**
 * Typed mock data for building the UI before Supabase (D-022).
 * Only the fixture repositories import this; screens go through repositories.
 */
export { FIXTURE_NOW } from "./time";
export { adminUsers, categories, creatives, paymentMethods, users } from "./people";
export { services } from "./services";
export { projects, requestDetails } from "./requests";
export {
  auditEvents,
  billingEvents,
  capacityPrices,
  notifications,
  subscriptions,
} from "./platform";
