import { motion } from "framer-motion";
import project1 from "@/assets/project-1.jpg";
import project2 from "@/assets/project-2.jpg";
import project3 from "@/assets/project-3.jpg";
import project4 from "@/assets/project-4.jpg";

const projects = [
  {
    image: project1,
    title: "Rumah Japandi Cipete",
    type: "Modern Japandi",
    land: "8 × 15m",
    area: "180 m²",
    cost: "Rp 1.2M",
  },
  {
    image: project2,
    title: "Rumah Tropis Bintaro",
    type: "Modern Tropis",
    land: "10 × 20m",
    area: "240 m²",
    cost: "Rp 1.8M",
  },
  {
    image: project3,
    title: "Loft Industrial Kemang",
    type: "Industrial",
    land: "6 × 12m",
    area: "120 m²",
    cost: "Rp 850Jt",
  },
  {
    image: project4,
    title: "Villa Minimalis Sentul",
    type: "Minimalis",
    land: "12 × 25m",
    area: "320 m²",
    cost: "Rp 2.4M",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const ProjectsSection = () => {
  return (
    <section id="proyek" className="py-32">
      <div className="container mx-auto px-6">
        <div className="flex items-end justify-between mb-16">
          <div>
            <p className="text-xs font-body font-medium uppercase tracking-widest text-primary mb-3">Portofolio</p>
            <h2 className="text-3xl md:text-5xl font-medium text-foreground">
              Proyek Terpilih
            </h2>
          </div>
          <a href="#" className="hidden md:block text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
            Lihat Semua →
          </a>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {projects.map((project) => (
            <motion.div
              key={project.title}
              variants={item}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-lg aspect-[3/4] shadow-card">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="inline-block text-[10px] font-body font-medium uppercase tracking-wider text-primary-foreground/70 mb-1">
                    {project.type}
                  </span>
                  <h3 className="text-base font-display text-primary-foreground tracking-normal">
                    {project.title}
                  </h3>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-4 text-xs font-body text-muted-foreground tabular-nums">
                <span>{project.land}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{project.area}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{project.cost}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectsSection;
