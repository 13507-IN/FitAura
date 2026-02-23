export function notFoundHandler(_req, res) {
  return res.status(404).json({
    success: false,
    error: "Route not found."
  });
}

export function errorHandler(error, _req, res, _next) {
  console.error(error);

  return res.status(500).json({
    success: false,
    error: "Internal server error."
  });
}
