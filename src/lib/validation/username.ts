// Letters (accents allowed), digits and _ ; uppercase allowed.
// Uniqueness ignores case (index on lower(username) in the database).
export const USERNAME_REGEX = /^[\p{L}\p{N}_]{3,20}$/u

export const USERNAME_HINT = '3 to 20 characters: letters (accents allowed), digits and _'

export function isUsernameValid(username: string): boolean {
  return USERNAME_REGEX.test(username)
}
