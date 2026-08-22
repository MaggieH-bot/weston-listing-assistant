module.exports = {
  reactStrictMode: true,
  async redirects() {
    // Listings moved from /l/<slug> to /<slug>. Links have already been
    // shared, so keep the old path working permanently.
    return [{ source: "/l/:slug", destination: "/:slug", permanent: true }];
  },
};
