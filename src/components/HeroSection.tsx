import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-house.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-end pb-20 pt-32 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Arsitektur modern Pomah Living"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-3xl"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium text-foreground leading-[1.05]">
            Arsitektur yang berpusat pada cara Anda hidup.
          </h1>
          <p className="mt-6 text-base md:text-lg leading-relaxed text-muted-foreground max-w-xl font-body">
            Jasa desain arsitektur & interior end-to-end. Dari konsep hingga konstruksi,
            dioptimalkan untuk hunian Anda.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <a
              href="#konsultasi"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-md text-sm font-medium font-body hover:opacity-90 transition-all active:scale-[0.98]"
            >
              Mulai Konsultasi
              <ArrowRight size={16} strokeWidth={1.5} />
            </a>
            <a
              href="#proyek"
              className="inline-flex items-center justify-center gap-2 bg-background/80 backdrop-blur text-foreground px-6 py-3.5 rounded-md text-sm font-medium font-body shadow-card hover:shadow-card-hover transition-all active:scale-[0.98]"
            >
              Lihat Proyek
            </a>
          </div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 flex gap-12 text-foreground"
          >
            {[
              { value: "142+", label: "Proyek Selesai" },
              { value: "12", label: "Kota" },
              { value: "98%", label: "Kepuasan Klien" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-display tabular-nums">{stat.value}</div>
                <div className="text-xs text-muted-foreground font-body mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
