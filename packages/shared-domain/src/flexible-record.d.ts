declare const __localeKeyBrand: unique symbol;

type FlexibleRecord<K extends PropertyKey, T> = Record<string, T> & {
  [__localeKeyBrand]?: K;
};
