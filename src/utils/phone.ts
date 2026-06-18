import { isValidPhoneNumber } from "libphonenumber-js/mobile";

export const isValidPhone = (
  countryCode?: string,
  phoneNumber?: string,
): boolean => {
  const trimmedPhone = phoneNumber?.trim();
  const trimmedCode = countryCode?.trim();
  if (!trimmedPhone || !trimmedCode) {
    return false;
  }

  const result = isValidPhoneNumber(`${trimmedCode}${trimmedPhone}`);
  console.log("result", result);
  return result;
};
