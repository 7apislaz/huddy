// zero-dep ANSI 색상 유틸. NO_COLOR / TERM=dumb 자동 감지.

const isColorDisabled =
  'NO_COLOR' in process.env ||
  process.env.TERM === 'dumb' ||
  !process.stdout.isTTY;

function wrap(open: string, close: string): (text: string) => string {
  if (isColorDisabled) return (text) => text;
  return (text) => `\x1b[${open}m${text}\x1b[${close}m`;
}

// 기본 색상
export const reset = wrap('0', '0');
export const bold = wrap('1', '22');
export const dim = wrap('2', '22');

// 전경색
export const red = wrap('31', '39');
export const green = wrap('32', '39');
export const yellow = wrap('33', '39');
export const blue = wrap('34', '39');
export const magenta = wrap('35', '39');
export const cyan = wrap('36', '39');
export const white = wrap('37', '39');
export const gray = wrap('90', '39');

// 색상 이름 → 함수 매핑
const colorMap: Record<string, (text: string) => string> = {
  red, green, yellow, blue, magenta, cyan, white, gray,
};

/** 색상 이름 문자열로 컬러 함수 가져오기 */
export function getColor(name: string): (text: string) => string {
  return colorMap[name] ?? ((text: string) => text);
}
