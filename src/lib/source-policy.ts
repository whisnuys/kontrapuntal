export type OptionalSource = {
  type?: string;
  title?: string;
  creator?: string;
  url?: string;
};

function hasValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function isOptionalSourceEmpty(source: OptionalSource | undefined): boolean {
  return !source || !Object.values(source).some((value) => hasValue(value));
}

export function isOptionalSourceComplete(source: OptionalSource | undefined): boolean {
  if (!source || isOptionalSourceEmpty(source)) return true;

  return hasValue(source.type) && hasValue(source.title);
}
