export const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const buildSearchPattern = (value?: string) => {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }

  return new RegExp(escapeRegex(normalized), "i");
};

export const parseDateSafe = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
};
