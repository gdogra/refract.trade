'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Brain, Map, DollarSign, Target, GraduationCap, Users } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Predictive AI Intelligence',
    description: 'AI-powered alerts that predict position adjustments before losses occur, not after.',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Map,
    title: 'Visual Risk Weather Map',
    description: 'Interactive heat maps showing real-time exposure across multiple market scenarios.',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: DollarSign,
    title: 'Integrated Tax Optimization',
    description: 'Real-time wash sale prevention and tax-loss harvesting worth thousands annually.',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: Target,
    title: 'Outcome-Based Discovery',
    description: 'Start with market outlook, not ticker symbols. AI recommends optimal strategies.',
    color: 'from-orange-500 to-orange-600'
  },
  {
    icon: GraduationCap,
    title: 'Adaptive Learning Sandbox',
    description: 'Practice with historical market events and personalized curriculum based on your style.',
    color: 'from-red-500 to-red-600'
  },
  {
    icon: Users,
    title: 'Social Intelligence',
    description: 'Anonymous performance benchmarking and community insights without copying signals.',
    color: 'from-indigo-500 to-indigo-600'
  }
]

const competitors = [
  { name: 'Tastytrade', weakness: 'Good education, but reactive alerts only' },
  { name: 'Interactive Brokers', weakness: 'Professional tools, poor mobile experience' },
  { name: 'thinkorswim', weakness: 'Advanced desktop, limited AI capabilities' },
  { name: 'Refract.trade', strength: 'Predictive AI + Mobile-First + Tax Optimization', highlight: true }
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              Refract.trade
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Revolutionary Options Trading Platform
            </p>
            <p className="text-lg mb-12 max-w-4xl mx-auto opacity-80">
              Empower traders with predictive AI, visual risk intelligence, and integrated tax optimization. 
              Make smarter decisions through institutional-grade tools with consumer-friendly design.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Revolutionary Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of options trading with AI-powered insights and institutional-grade tools
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Competitive Advantage */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Beyond Current Platforms
            </h2>
            <p className="text-xl text-gray-600">
              See how Refract.trade compares to existing solutions
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {competitors.map((competitor, index) => (
              <motion.div
                key={competitor.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className={`p-6 text-center h-full ${competitor.highlight ? 'ring-2 ring-primary-500 shadow-lg' : 'shadow-md'}`}>
                  <h4 className={`font-semibold mb-2 ${competitor.highlight ? 'text-primary-600' : 'text-gray-600'}`}>
                    {competitor.name}
                  </h4>
                  <p className={`text-sm ${competitor.highlight ? 'text-primary-500' : 'text-gray-500'}`}>
                    {competitor.strength || competitor.weakness}
                  </p>
                  {competitor.highlight && (
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        Our Solution
                      </span>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-8">
              Ready to Transform Your Options Trading?
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of traders who are already using AI to make smarter decisions and achieve better returns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4">
                  Start Free Trial
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4"
                onClick={() => {
                  const element = document.getElementById('features')
                  element?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                Refract.trade
              </div>
              <p className="text-gray-400">
                Revolutionizing options trading through AI and innovation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition">About</Link></li>
                <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Refract.trade. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}