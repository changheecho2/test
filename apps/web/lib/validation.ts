const contactPatterns = [
  /01[016789][ -]?\d{3,4}[ -]?\d{4}/,
  /\b0\d{1,2}[ -]?\d{3,4}[ -]?\d{4}\b/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /(https?:\/\/|www\.)/i,
  /\.(com|net|io|co|kr|me|app|link|gg|tv|me)\b/i,
  /(카톡|카카오|kakao|오픈채팅|open\.kakao|아이디|\bID\b)/i,
  /(텔레그램|telegram|라인|line|디스코드|discord)/i
];

export function containsContactInfo(text: string) {
  return contactPatterns.some((pattern) => pattern.test(text));
}

export function validateNoContact(text: string) {
  if (!text) return null;
  if (containsContactInfo(text)) {
    return "연락처/카카오톡ID/외부 링크는 입력할 수 없습니다. 수락 후에만 연락처가 공개됩니다.";
  }
  return null;
}
