import nextConfig from "eslint-config-next";

export default [
  ...nextConfig,
  {
    rules: {
      "react/jsx-key": "warn"
    }
  }
];

