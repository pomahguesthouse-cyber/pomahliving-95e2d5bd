import { motion } from "framer-motion";
import { PenTool, Hammer, FileText } from "lucide-react";

const services = [
  {
    icon: PenTool,
    title: "Desain Arsitektur",
    description: "Denah, tampak, potongan, dan render 3D. Dioptimalkan untuk lahan dan anggaran Anda.",
    features: ["Konsultasi awal", "Denah & 3D Render", "Revisi 3×", "Dokumen IMB"],
  },
  {
    icon: Hammer,
    title: "Desain + Bangun",
    description: "Paket lengkap dari konsep hingga serah terima kunci. Satu titik kontak, tanpa kerumitan.",
    features: ["Semua fitur Desain", "Manajemen konstruksi", "Pengawasan lapangan", "Garansi 1 tahun"],
  },
  {
    icon: FileText,
    title: "Interior",
    description: "Desain interior yang menyatu dengan arsitektur. Furnitur custom dan styling.",
    features: ["Mood board", "Layout furnitur", "Custom furniture", "Styling & dekor"],
  },
];

const ServicesSection = () => {
  return (
    <section id="layanan" className="py-32 bg-muted/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-body font-medium uppercase tracking-widest text-primary mb-3">Layanan</p>
          <h2 className="text-3xl md:text-5xl font-medium text-foreground">
            Pilih sesuai kebutuhan
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-card rounded-lg p-8 shadow-card hover:shadow-card-hover transition-shadow duration-300"
            >
              <service.icon size={24} strokeWidth={1.5} className="text-primary mb-6" />
              <h3 className="text-xl font-display text-foreground tracking-normal mb-3">{service.title}</h3>
              <p className="text-sm font-body text-muted-foreground leading-relaxed mb-6">
                {service.description}
              </p>
              <ul className="space-y-2.5">
                {service.features.map((feature) => (
                  <li key={feature} className="text-sm font-body text-foreground/80 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
