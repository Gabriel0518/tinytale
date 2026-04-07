export * from './entities';
export * from './creator';

declare const localeKeyBrand: unique symbol;

export type FlexibleRecord<K extends PropertyKey, T> = Record<string, T> & {
  [localeKeyBrand]?: K;
};
