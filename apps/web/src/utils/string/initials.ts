// convert 'Charles, King HLTH:EX" -> "KC"
export const getInitials = (fullName = '') => {
  const surnameInitial = fullName[0] || '';

  const firstNameInitial =
    fullName.indexOf(', ') !== -1 && fullName[fullName.indexOf(', ') + 2]
      ? fullName[fullName.indexOf(', ') + 2]
      : '';

  // else, return first and last letters only
  return (firstNameInitial + surnameInitial).toUpperCase();
};
