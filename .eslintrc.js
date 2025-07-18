module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    // Disable the problematic TypeScript rules since the plugins aren't installed
    // "@typescript-eslint/no-unused-vars": "off",
    // "@typescript-eslint/no-explicit-any": "off",
    
    // Fix React-specific issues
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react/no-unescaped-entities": "off",
    
    // General rules
    "@next/next/no-img-element": "off",
  },
}
