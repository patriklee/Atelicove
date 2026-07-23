export const clearStoredAuth = () => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('user');
  localStorage.removeItem('username');
  localStorage.removeItem('loggedInUser');
};

export const storeUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('username', user.username);
};
