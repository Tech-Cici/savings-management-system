import { Card, CardContent } from "@/components/ui/card"
import { Target, TrendingUp, Shield, Bell, PieChart, Zap } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: Target,
      title: "Goal Setting",
      description:
        "Set personalized savings goals and track your progress with visual milestones and smart recommendations.",
    },
    {
      icon: TrendingUp,
      title: "Smart Analytics",
      description:
        "Get detailed insights into your spending patterns and discover opportunities to save more every month.",
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your financial data is protected with 256-bit encryption and multi-factor authentication.",
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description: "Receive timely notifications about bill payments, savings milestones, and unusual spending.",
    },
    {
      icon: PieChart,
      title: "Budget Planning",
      description: "Create custom budgets for different categories and get alerts when you approach your limits.",
    },
    {
      icon: Zap,
      title: "Automated Savings",
      description: "Set up automatic transfers to your savings goals based on your income and spending patterns.",
    },
  ]

  return (
    <section id="features" className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Everything You Need to Save Smarter
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Powerful features designed to help you take control of your finances and achieve your savings goals faster.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-border hover:border-accent/50 transition-colors">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
