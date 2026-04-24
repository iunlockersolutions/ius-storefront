export interface QueryParams {
  [key: string]: string | number | boolean | undefined
}

export const generateQueryString = (params: QueryParams): string => {
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&")
  return queryString ? `?${queryString}` : ""
}
