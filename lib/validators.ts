export function isValidEmail(value: string): boolean {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value);
}

export function isValidPassword(value: string): boolean {
  // 8~15, at least one special char
  return /^(?=.*[^A-Za-z0-9]).{8,15}$/.test(value);
}

export function isValidPhoneNumber11(value: string): boolean {
  return /^[0-9]{11}$/.test(value);
}

export function isValidBirthDateNotFuture(
  value: string,
  todayIso: string
): boolean {
  if (!value) return false;
  return new Date(value) <= new Date(todayIso);
}
