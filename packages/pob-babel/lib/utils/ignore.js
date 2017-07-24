module.exports = filename => {
  if (filename.endsWith('.test.js') || filename.endsWith('.test.jsx')) return true;
  if (filename.includes('/__tests__/')) return true;
  return false;
};
