import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Pill,
  Truck,
  Shield,
  Clock,
  Brain,
  ScanLine,
  MessageSquare,
  Star,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Heart
} from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const LandingPage = () => {
  const features = [
    {
      icon: ScanLine,
      title: "AI Prescription Scanner",
      description: "Upload your prescription and let our AI extract medicines automatically",
      color: "bg-blue-500"
    },
    {
      icon: MessageSquare,
      title: "AI Doctor Chat",
      description: "Get instant health guidance from our AI-powered assistant",
      color: "bg-cyan-500"
    },
    {
      icon: Truck,
      title: "Same-Hour Delivery",
      description: "Priority delivery for emergency medicines within 60 minutes",
      color: "bg-emerald-500"
    },
    {
      icon: Shield,
      title: "100% Genuine",
      description: "All medicines sourced from verified pharmacies only",
      color: "bg-violet-500"
    }
  ];

  const stats = [
    { value: "50K+", label: "Happy Customers" },
    { value: "10K+", label: "Medicines" },
    { value: "500+", label: "Partner Pharmacies" },
    { value: "30min", label: "Avg. Delivery" }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Regular Customer",
      content: "MedsZop has been a lifesaver! The AI prescription scanner saved me so much time.",
      rating: 5
    },
    {
      name: "Dr. Rajesh Kumar",
      role: "Healthcare Professional",
      content: "Finally, a platform that understands healthcare needs. Highly recommended!",
      rating: 5
    },
    {
      name: "Amit Patel",
      role: "Pharmacy Owner",
      content: "As a pharmacy partner, the dashboard is intuitive and order management is seamless.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero z-10">
        <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,...')] opacity-50" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-primary/10 text-primary border-0 px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Smart HealthTech Platform
              </Badge>
              
              <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
                Your Health,{" "}
                <span className="text-primary">Delivered</span>
                <br />Smarter
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-lg">
                India's most intelligent medicine ordering platform. AI-powered prescription scanning, trusted pharmacies, and lightning-fast delivery.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/medicines" data-testid="explore-medicines-btn">
                  <Button size="lg" className="rounded-full h-12 px-8 text-base shadow-lg hover:shadow-xl transition-all">
                    Explore Medicines
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/prescription-scan" data-testid="scan-prescription-btn">
                  <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base">
                    <ScanLine className="mr-2 h-4 w-4" />
                    Scan Prescription
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-10">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-200 dark:bg-slate-700" />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Trusted by 50,000+ users</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-4 pointer-events-none bg-gradient-to-r from-primary/20 to-cyan-500/20 rounded-3xl blur-3xl" />

                <img
                  src="https://images.pexels.com/photos/8313184/pexels-photo-8313184.jpeg"
                  alt="Healthcare consultation"
                  className="relative rounded-3xl shadow-2xl w-full object-cover h-[500px]"
                />
                
                {/* Floating Cards */}
                <Card className="absolute -left-8 top-20 bg-white dark:bg-slate-800 shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Order Delivered</p>
                      <p className="text-xs text-muted-foreground">In 28 minutes</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="absolute -right-4 bottom-20 bg-white dark:bg-slate-800 shadow-xl animate-bounce" style={{ animationDuration: '4s' }}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">AI Analysis</p>
                      <p className="text-xs text-muted-foreground">Prescription scanned</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                className="text-center"
              >
                <p className="font-heading text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </p>
                <p className="text-primary-foreground/80">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-0">Features</Badge>
            <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Why Choose MedsZop?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We combine cutting-edge technology with healthcare expertise to deliver the best experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full">
                  <CardContent className="p-0">
                    <div className={`h-12 w-12 rounded-2xl ${feature.color} flex items-center justify-center mb-5`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-0">
                <Brain className="h-3.5 w-3.5 mr-1.5" />
                AI-Powered
              </Badge>
              <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-6">
                Healthcare Meets{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">
                  Artificial Intelligence
                </span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our AI tools make healthcare more accessible. Scan prescriptions instantly, chat with our AI doctor for guidance, and get personalized medicine recommendations.
              </p>
              
              <div className="space-y-4">
                {[
                  "Instant prescription text extraction",
                  "Medicine name recognition & matching",
                  "Symptom-based health guidance",
                  "Drug interaction warnings"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-8">
                <Link to="/prescription-scan">
                  <Button className="rounded-full">
                    Try AI Scanner
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/doctor-chat">
                  <Button variant="outline" className="rounded-full">
                    Chat with AI Doctor
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-primary/20 rounded-3xl blur-3xl" />
              <img
                src="https://images.unsplash.com/photo-1516192518150-0d8fee5425e3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwbWVkaWNhbCUyMGFic3RyYWN0fGVufDB8fHx8MTc2OTExNjIxNXww&ixlib=rb-4.1.0&q=85"
                alt="AI Technology"
                className="relative rounded-3xl shadow-2xl w-full object-cover h-[450px]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-0">Testimonials</Badge>
            <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Loved by Thousands
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our customers and partners have to say about MedsZop
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl p-6 h-full">
                  <CardContent className="p-0">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-foreground mb-6 font-accent italic">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">
                          {testimonial.name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Heart className="h-12 w-12 text-white/80 mx-auto mb-6" />
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6">
              Start Your Health Journey Today
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of happy customers who trust MedsZop for their healthcare needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" data-testid="cta-get-started">
                <Button size="lg" variant="secondary" className="rounded-full h-12 px-8 text-base">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/medicines">
                <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base bg-transparent text-white border-white hover:bg-white hover:text-primary">
                  Browse Medicines
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
