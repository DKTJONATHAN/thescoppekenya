const hashPin = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

const VALID_HASHES = [hashPin("1711"), hashPin("2000")];

export function validatePin(pin: string): boolean {
  return VALID_HASHES.includes(hashPin(pin));
}

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem("admin_auth") === "true";
}

export function setAdminAuthenticated(value: boolean) {
  if (value) {
    sessionStorage.setItem("admin_auth", "true");
  } else {
    sessionStorage.removeItem("admin_auth");
  }
}
