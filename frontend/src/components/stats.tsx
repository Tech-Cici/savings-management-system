export function Stats() {
  const stats = [
    { label: "Average Savings Increase", value: "32%" },
    { label: "Goals Achieved", value: "15K+" },
    { label: "Money Saved", value: "$50M+" },
    { label: "Countries Supported", value: "45+" },
  ]

  return (
    <section className="py-16 bg-secondary/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
