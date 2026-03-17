import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const ConsultationSection = () => {
  return (
    <section id="konsultasi" className="py-32 bg-primary">
      <div className="container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h2 className="text-3xl md:text-5xl font-medium text-primary-foreground max-w-2xl mx-auto">
            Siap mewujudkan hunian yang dioptimalkan?
          </h2>
          <p className="mt-6 text-base font-body text-primary-foreground/70 max-w-lg mx-auto leading-relaxed">
            Jadwalkan konsultasi gratis 30 menit. Kami akan membahas kebutuhan, lahan, dan estimasi awal untuk proyek Anda.
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 mt-10 bg-background text-foreground px-8 py-4 rounded-md text-sm font-medium font-body hover:opacity-90 transition-all active:scale-[0.98]"
          >
            Jadwalkan Konsultasi
            <ArrowRight size={16} strokeWidth={1.5} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default ConsultationSection;
