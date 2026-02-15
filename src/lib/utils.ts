import { clsx } from 'clsx';

export const cn = (...values: Array<string | undefined | false>) => clsx(values);

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function randomInvitationCode(length = 6) {
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

export function formatDate(value?: string) {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString();
}
