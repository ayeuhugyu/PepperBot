// thank you stackoverflow
type NonMethodKeys<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]
export type OmitMethods<T> = Pick<T, NonMethodKeys<T>>