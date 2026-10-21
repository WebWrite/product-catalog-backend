function fillMissingDays(data, days = 30) {
  const map = new Map(data.map((d) => [d.date, d]))
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" })
    result.push(map.get(key) ?? { date: key, totalPrice: 0, totalOrders: 0 })
  }
  return result
}
export default fillMissingDays
