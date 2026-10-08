const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "product catalog",
      version: "1.0.0",
      description: "A product catalog Express API documented with Swagger"
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Development server"
      }
    ]
  },
  apis: ["./Routes/*.js", "./src/Routes/*.js"]
}
export default swaggerOptions
