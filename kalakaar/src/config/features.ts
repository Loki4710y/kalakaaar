/** Features whose screens exist but whose backend is not built yet. Keep false for v1. */
export const FEATURES = {
  commissions: false,
  notifications: false,
  reviews: false,
} as const;

/** Shown on the Privacy / Terms pages. Change to your real support address. */
export const CONTACT_EMAIL = "lm857133@gmail.com";

// Shown in the Privacy Policy and Terms. Replace with your real details before launch.
export const LEGAL = {
  operatorName: "Kalakaar",
  grievanceOfficer: "Grievance Officer",
  jurisdiction: "India",
};
