// convert 'King Charles" -> "KC"
export const getInitials = (fullName = '') => {
  // find initials of all words
  const initialsArray = fullName.split(' ').map((n: string) => n[0]);

  // if less than or equal to 2, return all letters
  if (initialsArray.length <= 2) return initialsArray.join('').toUpperCase();

  // else, return first and last letters only
  return (initialsArray[0] + initialsArray[initialsArray.length - 1]).toUpperCase();
};
