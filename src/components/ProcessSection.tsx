import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Brief",
    description: "Diskusi kebutuhan, gaya hidup, dan anggaran. Kami analisis lahan dan regulasi setempat.",
  },
  {
    number: "02",
    title: "Konsep",
    description: "Pengembangan denah awal, studi massa, dan presentasi konsep desain 3D.",
  },
  {
    number: "03",
    title: "Pengembangan",
    description: "Detail gambar kerja, spesifikasi material, dan dokumen perizinan (IMB).",
  },
  {
    number: "04",
    title: "Realisasi",
    description: "Pengawasan konstruksi, kontrol kualitas, hingga serah terima kunci.",
  },
];

const ProcessSection = () => {
  return (
    <section id="proses" className="py-32">
      <div className="container mx-auto px-6">
        <div className="mb-16">
          <p className="text-xs font-body font-medium uppercase tracking-widest text-primary mb-3">Cara Kerja</p>
          <h2 className="text-3xl md:text-5xl font-medium text-foreground max-w-xl">
            Proses yang transparan dan terstruktur
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <span className="text-5xl font-display text-muted-foreground/30">{step.number}</span>
              <h3 className="text-lg font-display text-foreground tracking-normal mt-4 mb-2">{step.title}</h3>
              <p className="text-sm font-body text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
