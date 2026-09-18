export function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return res.end();
  res.status(500).json({ error: "Something went wrong. Please try again." });
}
