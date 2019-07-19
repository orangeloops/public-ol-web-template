module.exports = {
  "src/**/*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix", "git add"],
  "**/*.{css,scss}": ["prettier --write", "git add"], // "stylelint --fix"
};